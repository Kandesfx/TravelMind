# Suppress ALL warnings and stderr noise BEFORE any imports
import warnings
warnings.simplefilter("ignore")
warnings.filterwarnings("ignore", category=DeprecationWarning)

import os
os.environ["PYTHONWARNINGS"] = "ignore"

# Suppress matplotlib's direct stderr output during import
import sys
import io

_real_stderr = sys.stderr
sys.stderr = io.StringIO()  # Temporarily redirect stderr

try:
    from app import create_app
    app = create_app()
finally:
    sys.stderr = _real_stderr  # Restore stderr after all imports done

# Re-enable important warnings for runtime
warnings.filterwarnings("default", category=RuntimeWarning)
warnings.filterwarnings("default", category=UserWarning)

if __name__ == '__main__':
    print("=" * 50)
    print("  TravelMind API Server")
    print("  http://localhost:5000")
    print("=" * 50)
    app.run(host='0.0.0.0', port=5000, debug=True)
