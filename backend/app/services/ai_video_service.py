import os
import shutil
import subprocess
import time
import base64
from pathlib import Path
from flask import current_app
from app.extensions import db
from app.models.ai_provider import AIProvider
from app.models.ai_usage import AIUsageLog

# Tiny valid 1-second blank MP4 for last-resort fallback
TINY_MP4_BASE64 = (
    "AAAAGGZ0eXBtcDQyAAAAAG1wNDJpc29tAAAAhGZyZWUAAAAmbWRhdAAAAAAAAAAV4EAH/4NsdD8i3t"
    "1h1n2v61tXAAAAF21vb3YAAABsbXZoZAAAAAAAAAAAAAAAAAAAA+gAAAAoAAEAAAEAAAAAAAAAAAAA"
    "AAEAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
    "AAAAAAAIAAAAudHJoZAAAAAF0AAAAAAAAAAAAAAABAAAAAAAAGQAAAAAAAAAAAAAAAQAAAAAAAAAAAA"
    "AAAAAAAAEAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAQAAABJtZGlhAAAAIG1kaGQAAAAAAAAA"
    "AAAAAAAAAAPoAAAAKAAAAAVhRUwAAACttaW5mAAAAEGRtaGhkAAAAAAAAAAAAAAAQZGluZgAAABxk"
    "c3JlAAAAAAAAABJ1cmwgAAAAAQAAAAltc2hkAAAAFHRoZGUAAAAAAAAAAAAAAAEAAAAAc3RibAAAAE"
    "1zdHNkAAAAAAAAAAEAAAAvbXA0dgAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAGgAaAEgAAABIAAAA"
    "AAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGWRzY28AAAAMZHNleHQAAAAA"
)


def _ffmpeg_exe() -> str:
    """
    Returns the ffmpeg executable path.
    Checks: 1) local backend/bin/ffmpeg.exe, 2) PATH.
    """
    # Check local bundled path first
    base = Path(__file__).resolve().parent.parent.parent  # backend root
    local_ffmpeg = base / "bin" / "ffmpeg.exe"
    if local_ffmpeg.exists():
        return str(local_ffmpeg)
    # Fall back to system PATH
    return "ffmpeg"


def check_ffmpeg_available() -> bool:
    """Returns True if ffmpeg is runnable."""
    try:
        result = subprocess.run(
            [_ffmpeg_exe(), "-version"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            timeout=5
        )
        return result.returncode == 0
    except Exception:
        return False


def _resolve_local_path(file_url: str, uploads_dir: Path) -> Path | None:
    """Convert a /static/uploads/xxx.jpg URL into an absolute filesystem path."""
    filename = file_url.split("/")[-1]
    path = uploads_dir / filename
    return path if path.exists() else None


def _write_ffmpeg_concat_list(image_paths: list[Path], slide_duration: float, tmp_dir: Path) -> Path:
    """
    Writes an FFmpeg concat demuxer file where each image appears for slide_duration seconds.
    """
    concat_file = tmp_dir / "concat_list.txt"
    with open(concat_file, "w", encoding="utf-8") as f:
        for img_path in image_paths:
            f.write(f"file '{str(img_path).replace(chr(92), '/')}'\n")
            f.write(f"duration {slide_duration:.2f}\n")
        # Repeat last image once more (FFmpeg concat quirk for last frame)
        if image_paths:
            f.write(f"file '{str(image_paths[-1]).replace(chr(92), '/')}'\n")
    return concat_file


def generate_slideshow_video(image_urls: list, texts: list,
                             music_name: str = "tropical_vibes",
                             duration: int = 15,
                             admin_id: int = None) -> dict:
    """
    Compiles a slideshow video using FFmpeg.

    Strategy:
    - Each image is displayed for (duration / num_images) seconds with a zoom-in (Ken Burns) effect.
    - Crossfade transitions between slides using the xfade filter.
    - Text subtitles overlaid on each slide via drawtext.
    - Falls back to a blank placeholder MP4 if FFmpeg fails or is not installed.
    """
    provider = AIProvider.query.filter_by(provider_name='ffmpeg', is_active=True).first()
    provider_id = provider.id if provider else 1

    filename = f"ai_video_{int(time.time())}.mp4"
    uploads_dir = Path(current_app.config['UPLOAD_FOLDER'])
    target_path = uploads_dir / filename
    static_url = f"/static/uploads/{filename}"
    os.makedirs(uploads_dir, exist_ok=True)

    start_time = time.time()
    ffmpeg_ok = check_ffmpeg_available()

    if ffmpeg_ok and image_urls:
        print(f"[ai_video] FFmpeg khả dụng. Bắt đầu dựng {len(image_urls)} ảnh → {filename}")

        # Resolve local paths, skip missing files
        local_paths = []
        for url in image_urls:
            p = _resolve_local_path(url, uploads_dir)
            if p:
                local_paths.append(p)
            else:
                print(f"[ai_video] Bỏ qua ảnh không tìm thấy: {url}")

        if local_paths:
            n = len(local_paths)
            slide_dur = max(2.0, round(duration / n, 2))  # at least 2s per slide
            total_dur = slide_dur * n
            ffmpeg = _ffmpeg_exe()

            # ── Build FFmpeg filter_complex for multi-image slideshow ──
            # Each image: scale → pad → zoompan (Ken Burns) → setpts
            # Then concat, then optional drawtext subtitles

            filter_parts = []
            concat_inputs = ""

            for i, img_path in enumerate(local_paths):
                zoom_speed = 0.0005 if i % 2 == 0 else -0.0005  # alternate zoom in/out
                safe_zoom = f"'min(zoom+{abs(zoom_speed)},1.05)'" if zoom_speed > 0 else f"'max(zoom-{abs(zoom_speed)},1.0)'"

                filter_parts.append(
                    f"[{i}:v]scale=1280:720:force_original_aspect_ratio=increase,"
                    f"crop=1280:720,"
                    f"zoompan=z={safe_zoom}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'"
                    f":d={int(slide_dur * 25)}:fps=25:s=1280x720,"
                    f"setpts=PTS-STARTPTS,trim=duration={slide_dur}[v{i}];"
                )
                concat_inputs += f"[v{i}]"

            filter_complex = "".join(filter_parts)
            filter_complex += f"{concat_inputs}concat=n={n}:v=1:a=0[vout]"

            # Add slide text overlays (drawtext for each subtitle text)
            if texts:
                text_filter = "[vout]"
                for i, txt in enumerate(texts[:n]):
                    # Show text during this slide's time window
                    t_start = i * slide_dur
                    t_end = t_start + slide_dur
                    safe_txt = txt.replace("'", "\\'").replace(":", "\\:")
                    text_filter += (
                        f"drawtext=fontsize=36:fontcolor=white:x=(w-text_w)/2:y=h-80:"
                        f"text='{safe_txt}':"
                        f"enable='between(t,{t_start:.1f},{t_end:.1f})':"
                        f"shadowcolor=black:shadowx=2:shadowy=2"
                    )
                    if i < min(len(texts), n) - 1:
                        text_filter += ","
                filter_complex += f";{text_filter}[vfinal]"
                output_map = "[vfinal]"
            else:
                filter_complex += ""
                output_map = "[vout]"

            # Build input args: one -loop 1 -t slide_dur -i img per slide
            input_args = []
            for img_path in local_paths:
                input_args += ["-loop", "1", "-t", str(slide_dur), "-i", str(img_path)]

            cmd = (
                [ffmpeg, "-y"]
                + input_args
                + [
                    "-filter_complex", filter_complex,
                    "-map", output_map,
                    "-c:v", "libx264",
                    "-preset", "ultrafast",
                    "-crf", "28",
                    "-t", str(total_dur),
                    "-pix_fmt", "yuv420p",
                    "-movflags", "+faststart",
                    str(target_path)
                ]
            )

            print(f"[ai_video] Running FFmpeg (n={n}, slide_dur={slide_dur}s, total={total_dur}s)")
            try:
                result = subprocess.run(
                    cmd,
                    capture_output=True,
                    text=True,
                    timeout=120
                )
                if result.returncode == 0 and target_path.exists() and target_path.stat().st_size > 10_000:
                    elapsed = int((time.time() - start_time) * 1000)
                    size_mb = round(target_path.stat().st_size / (1024 * 1024), 2)
                    print(f"[ai_video] ✅ Video dựng xong: {size_mb} MB, {elapsed}ms")
                    _log_usage(provider_id, "video_gen", 0, 0.0,
                               f"FFmpeg slideshow: {n} ảnh, {total_dur}s", elapsed, admin_id)
                    return {"url": static_url, "duration": int(total_dur),
                            "size_mb": size_mb, "status": "draft"}
                else:
                    print(f"[ai_video] FFmpeg thất bại (code={result.returncode}).")
                    print(f"[ai_video] STDERR: {result.stderr[-500:]}")
            except subprocess.TimeoutExpired:
                print("[ai_video] FFmpeg timeout sau 120 giây.")
            except Exception as e:
                print(f"[ai_video] Lỗi FFmpeg: {str(e)}")

        # ── Single image fallback (simpler FFmpeg command) ──
        if local_paths:
            print("[ai_video] Thử command đơn giản hơn (single image loop)...")
            first_img = local_paths[0]
            ffmpeg = _ffmpeg_exe()
            simple_cmd = [
                ffmpeg, "-y",
                "-loop", "1", "-i", str(first_img),
                "-c:v", "libx264", "-t", str(duration),
                "-pix_fmt", "yuv420p", "-preset", "ultrafast",
                "-vf", f"scale=1280:720,drawtext=text='TravelMind':fontcolor=white:fontsize=42:x=(w-text_w)/2:y=h-80:shadowcolor=black:shadowx=2:shadowy=2",
                str(target_path)
            ]
            try:
                result = subprocess.run(simple_cmd, capture_output=True, text=True, timeout=30)
                if result.returncode == 0 and target_path.exists():
                    elapsed = int((time.time() - start_time) * 1000)
                    size_mb = round(target_path.stat().st_size / (1024 * 1024), 2)
                    print(f"[ai_video] ✅ Simple video xong: {size_mb} MB")
                    _log_usage(provider_id, "video_gen", 0, 0.0,
                               "FFmpeg single-image loop", elapsed, admin_id)
                    return {"url": static_url, "duration": duration,
                            "size_mb": size_mb, "status": "draft"}
            except Exception as e:
                print(f"[ai_video] Simple FFmpeg cũng thất bại: {str(e)}")

    # ── Last resort: write a blank placeholder MP4 ──
    print("[ai_video] Dùng placeholder MP4 fallback (không có FFmpeg hoặc không có ảnh).")
    try:
        with open(target_path, "wb") as f:
            f.write(base64.b64decode(TINY_MP4_BASE64))
        elapsed = int((time.time() - start_time) * 1000)
        _log_usage(provider_id, "video_gen", 0, 0.0,
                   "Blank MP4 fallback - FFmpeg not available", elapsed, admin_id)
        size_mb = round(target_path.stat().st_size / (1024 * 1024), 4) if target_path.exists() else 0.01
        return {"url": static_url, "duration": duration,
                "size_mb": size_mb, "status": "draft"}
    except Exception as e:
        print(f"[ai_video] Lỗi ghi fallback: {str(e)}")
        return {"url": "/static/uploads/placeholder.mp4",
                "duration": duration, "size_mb": 0.01, "status": "draft"}


def _log_usage(provider_id, content_type, tokens, cost, payload, response_ms, admin_id):
    try:
        log = AIUsageLog(
            provider_id=provider_id,
            content_type=content_type,
            tokens_used=tokens,
            cost_usd=cost,
            request_payload=payload,
            response_time_ms=response_ms,
            admin_id=admin_id
        )
        db.session.add(log)
        db.session.commit()
    except Exception as e:
        print(f"[ai_video] Không ghi được usage log: {str(e)}")
