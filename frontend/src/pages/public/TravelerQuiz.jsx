import React, { useState } from 'react';
import axios from 'axios';
import GlassCard from '../../components/GlassCard';
import { Brain, ArrowRight, ArrowLeft, RefreshCw, Briefcase, Award } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TravelerQuiz() {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [quizFinished, setQuizFinished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const questions = [
    {
      question: "Bạn thường lên kế hoạch đặt phòng trước chuyến đi bao lâu?",
      options: [
        { val: 'a', label: 'Từ rất sớm, thường khoảng 2-6 tháng để có giá tốt.' },
        { val: 'b', label: 'Cận ngày đi mới đặt, thường là trong vòng 1 tuần.' },
        { val: 'c', label: 'Đặt bất cứ khi nào có lịch công tác đột xuất.' },
        { val: 'd', label: 'Đặt trước khoảng 1-2 tháng cho một dịp đặc biệt.' },
        { val: 'e', label: 'Lên kế hoạch sớm cùng gia đình trước vài tháng.' }
      ]
    },
    {
      question: "Tiêu chí nào quan trọng nhất đối với bạn khi chọn dịch vụ lưu trú?",
      options: [
        { val: 'a', label: 'Bữa ăn ngon đi kèm và dịch vụ đầy đủ.' },
        { val: 'b', label: 'Giá phòng tiết kiệm và vị trí trung tâm thành phố.' },
        { val: 'c', label: 'Thủ tục check-in/out nhanh, không cần đặt cọc.' },
        { val: 'd', label: 'Không gian lãng mạn, phòng chất lượng cao (Suite).' },
        { val: 'e', label: 'Có dịch vụ thân thiện trẻ em và bãi đỗ xe.' }
      ]
    },
    {
      question: "Chuyến đi nghỉ cuối tuần lý tưởng của bạn trông như thế nào?",
      options: [
        { val: 'a', label: 'Trọn vẹn tại Resort, bơi lội và ăn buffet.' },
        { val: 'b', label: 'City break: khám phá ẩm thực đường phố và ngắm cảnh.' },
        { val: 'c', label: 'Không nghỉ cuối tuần, tập trung hoàn thành công việc.' },
        { val: 'd', label: 'Kỳ nghỉ dưỡng thư giãn hai người tại resort cao cấp.' },
        { val: 'e', label: 'Cả gia đình lái xe dã ngoại, vui chơi ở hồ bơi.' }
      ]
    },
    {
      question: "Bạn thường đi du lịch cùng với ai?",
      options: [
        { val: 'a', label: 'Đoàn du lịch lớn hoặc đại gia đình.' },
        { val: 'b', label: 'Đi cùng nhóm bạn bè thân thiết.' },
        { val: 'c', label: 'Đi một mình (Solo).' },
        { val: 'd', label: 'Đi cùng người yêu hoặc bạn đời (Couple).' },
        { val: 'e', label: 'Đi cùng con nhỏ và gia đình nhỏ.' }
      ]
    },
    {
      question: "Dịch vụ đi kèm nào là không thể thiếu đối với bạn?",
      options: [
        { val: 'a', label: 'Các gói buffet sáng và tối trọn gói.' },
        { val: 'b', label: 'Chỉ cần kết nối Wifi mạnh và phòng ngủ sạch sẽ.' },
        { val: 'c', label: 'Gói ăn sáng nhanh gọn và hỗ trợ hóa đơn VAT.' },
        { val: 'd', label: 'Dịch vụ spa, giường lớn thoải mái và phòng tắm đẹp.' },
        { val: 'e', label: 'Bãi đỗ xe ô tô an toàn và cũi cho em bé.' }
      ]
    }
  ];

  const handleSelectOption = (val) => {
    const qKey = `q${currentQ + 1}`;
    setAnswers({ ...answers, [qKey]: val });
    
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
    }
  };

  const handleBack = () => {
    if (currentQ > 0) {
      setCurrentQ(currentQ - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await axios.post('/api/public/quiz/submit', { answers });
      setResult(res.data);
      setQuizFinished(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setCurrentQ(0);
    setAnswers({});
    setQuizFinished(false);
    setResult(null);
  };

  const getComboBuilderUrl = (personaType) => {
    switch(personaType) {
      case 'family':
      case 'planner':
        return '/combo-builder?hotel_type=Resort&group=Family&season=Summer';
      case 'romantic':
        return '/combo-builder?hotel_type=Resort&group=Couple&season=Autumn';
      case 'business':
      case 'last_minute':
        return '/combo-builder?hotel_type=City&group=Solo&season=Summer';
      default:
        return '/combo-builder';
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }} className="animate-fade-in">
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Traveler Persona Quiz</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.5rem' }}>
          {quizFinished ? 'Kết quả phân loại của bạn' : `Câu hỏi ${currentQ + 1}/${questions.length}`}
        </p>
      </div>

      {!quizFinished ? (
        <GlassCard style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Question Text */}
          <h3 style={{ color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 700, lineHeight: 1.5 }}>
            {questions[currentQ].question}
          </h3>

          {/* Options list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {questions[currentQ].options.map((opt, idx) => {
              const qKey = `q${currentQ + 1}`;
              const isSelected = answers[qKey] === opt.val;
              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(opt.val)}
                  style={{
                    background: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'var(--input-bg)',
                    border: isSelected ? '2px solid var(--primary)' : '1px solid var(--panel-border)',
                    borderRadius: '10px',
                    padding: '1rem',
                    color: isSelected ? 'white' : 'var(--text-primary)',
                    textAlign: 'left',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    fontWeight: isSelected ? 600 : 400,
                    transition: 'var(--transition-smooth)'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.borderColor = 'var(--panel-border-hover)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.borderColor = 'var(--panel-border)';
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
            <button
              onClick={handleBack}
              disabled={currentQ === 0}
              className="glass-button glass-button-secondary"
              style={{ opacity: currentQ === 0 ? 0.3 : 1, cursor: currentQ === 0 ? 'not-allowed' : 'pointer' }}
            >
              <ArrowLeft size={16} />
              <span>Quay lại</span>
            </button>

            {currentQ === questions.length - 1 && answers[`q${questions.length}`] ? (
              <button onClick={handleSubmit} className="glass-button" style={{ background: 'linear-gradient(135deg, #6366f1, #d946ef)' }} disabled={loading}>
                <span>{loading ? 'Đang phân tích...' : 'Xem kết quả'}</span>
                <ArrowRight size={16} />
              </button>
            ) : null}
          </div>
        </GlassCard>
      ) : (
        <GlassCard style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', textAlign: 'center' }} className="animate-fade-in">
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: '2rem'
          }}>
            <Award size={32} color="var(--primary)" />
          </div>
          
          <div>
            <h2 style={{ fontSize: '1.8rem', color: 'var(--text-primary)' }}>{result?.persona.name}</h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Nhóm này chiếm khoảng {result?.persona.percentage}% tổng số du khách trên cơ sở dữ liệu.
            </div>
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, maxWidth: '500px' }}>
            {result?.persona.description}
          </p>

          {result?.recommended_combo && (
            <div style={{
              width: '100%',
              background: 'var(--input-bg)',
              border: '1px solid var(--section-border)',
              borderRadius: '12px',
              padding: '1.25rem',
              marginTop: '0.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ textAlign: 'left' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Gợi ý combo dành cho bạn</span>
                <h4 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 700, marginTop: '0.15rem' }}>{result.recommended_combo.name}</h4>
              </div>
              <Link to={getComboBuilderUrl(result?.persona?.type)} className="glass-button" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}>
                <span>Xem Ngay</span>
                <ArrowRight size={12} />
              </Link>
            </div>
          )}

          <button onClick={handleReset} className="glass-button glass-button-secondary" style={{ marginTop: '1rem' }}>
            <RefreshCw size={14} />
            <span>Làm lại quiz</span>
          </button>
        </GlassCard>
      )}
    </div>
  );
}
