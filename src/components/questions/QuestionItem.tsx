/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Question, StudentAnswer, CognitiveLevel, QuestionType } from '../../types';
import { CheckCircle2, XCircle, HelpCircle, Image, Video, ExternalLink, Lightbulb, FileText } from 'lucide-react';

interface QuestionItemProps {
  question: Question;
  index: number;
  mode: 'practice' | 'exam' | 'preview';
  studentAnswer?: StudentAnswer;
  onAnswerChange?: (ans: StudentAnswer) => void;
  showAnswer?: boolean;
}

export const QuestionItem: React.FC<QuestionItemProps> = ({
  question,
  index,
  mode,
  studentAnswer,
  onAnswerChange,
  showAnswer = false,
}) => {
  // Local state for interactive practice / answers
  const [selectedOptions, setSelectedOptions] = useState<number[]>(
    studentAnswer?.selectedOptionIndices || []
  );
  const [tfAnswers, setTfAnswers] = useState<boolean[]>(
    studentAnswer?.trueFalseAnswers || []
  );
  const [matchingAns, setMatchingAns] = useState<{ [left: number]: number }>(
    studentAnswer?.matchingAnswers || {}
  );
  const [textAns, setTextAns] = useState<string>(
    studentAnswer?.textAnswer || ''
  );
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    if (studentAnswer) {
      if (studentAnswer.selectedOptionIndices) setSelectedOptions(studentAnswer.selectedOptionIndices);
      if (studentAnswer.trueFalseAnswers) setTfAnswers(studentAnswer.trueFalseAnswers);
      if (studentAnswer.matchingAnswers) setMatchingAns(studentAnswer.matchingAnswers);
      if (studentAnswer.textAnswer !== undefined) setTextAns(studentAnswer.textAnswer);
    }
  }, [studentAnswer]);

  const updateAnswers = (newObj: Partial<StudentAnswer>) => {
    if (!onAnswerChange) return;
    onAnswerChange({
      questionId: question.id,
      selectedOptionIndices: selectedOptions,
      trueFalseAnswers: tfAnswers,
      matchingAnswers: matchingAns,
      textAnswer: textAns,
      ...newObj,
    });
  };

  const getCognitiveBadge = (level: CognitiveLevel) => {
    switch (level) {
      case 'biet':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200/80">
            Biết (Nhận biết)
          </span>
        );
      case 'hieu':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
            Hiểu (Thông hiểu)
          </span>
        );
      case 'van-dung':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/80">
            Vận dụng
          </span>
        );
    }
  };

  const getTypeLabel = (type: QuestionType) => {
    switch (type) {
      case 'multiple-choice': return 'Trắc nghiệm';
      case 'true-false': return 'Đúng / Sai';
      case 'matching': return 'Nối cột A - B';
      case 'short-answer': return 'Trả lời ngắn';
      case 'fill-in-blank': return 'Điền khuyết';
      case 'essay': return 'Tự luận';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs transition-all mb-4">
      {/* Question Header Meta */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-800 font-bold text-xs">
            {index + 1}
          </span>
          <span className="text-xs font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60">
            {getTypeLabel(question.type)}
          </span>
          {getCognitiveBadge(question.cognitiveLevel)}
        </div>
        <div className="text-xs text-slate-400 truncate max-w-[200px] sm:max-w-xs">
          {question.lessonName}
        </div>
      </div>

      {/* Question Stem / Content */}
      <div className="text-slate-900 font-medium text-sm sm:text-base leading-relaxed mb-4">
        {question.questionText}
      </div>

      {/* Media Attachment (Image / Video) */}
      {question.mediaUrl && (
        <div className="mb-4 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 max-w-xl">
          {question.mediaType === 'image' || (!question.mediaType && question.mediaUrl.match(/\.(jpeg|jpg|gif|png|webp)/i)) ? (
            <img
              src={question.mediaUrl}
              alt="Hình ảnh câu hỏi"
              referrerPolicy="no-referrer"
              className="w-full max-h-80 object-contain bg-black/5"
            />
          ) : question.mediaUrl.includes('youtube.com') || question.mediaUrl.includes('youtu.be') ? (
            <div className="aspect-video w-full">
              <iframe
                src={question.mediaUrl.replace('watch?v=', 'embed/')}
                title="Video câu hỏi"
                className="w-full h-full"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="p-3 flex items-center justify-between text-xs text-slate-600">
              <span className="truncate">{question.mediaUrl}</span>
              <a
                href={question.mediaUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 font-medium hover:underline shrink-0 ml-2"
              >
                Mở liên kết <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>
      )}

      {/* ---------------- TYPE SPECIFIC RENDERING ---------------- */}

      {/* 1. Multiple Choice */}
      {question.type === 'multiple-choice' && question.options && (
        <div className="space-y-2 mb-4">
          {question.options.map((opt, optIdx) => {
            const isSelected = selectedOptions.includes(optIdx);
            const isCorrect = question.correctAnswers?.includes(optIdx);
            const isMultiple = (question.correctAnswers?.length || 1) > 1;

            let stateStyle = 'border-slate-200 bg-slate-50/60 hover:bg-slate-100/70 text-slate-800';
            if (showAnswer || mode === 'preview') {
              if (isCorrect) {
                stateStyle = 'border-emerald-300 bg-emerald-50/90 text-emerald-900 font-medium';
              } else if (isSelected && !isCorrect) {
                stateStyle = 'border-rose-300 bg-rose-50/90 text-rose-900 line-through';
              }
            } else if (isSelected) {
              stateStyle = 'border-amber-400 bg-amber-50/80 text-amber-950 font-medium shadow-xs';
            }

            return (
              <button
                key={optIdx}
                type="button"
                disabled={mode === 'preview'}
                onClick={() => {
                  let next: number[];
                  if (isMultiple) {
                    next = isSelected
                      ? selectedOptions.filter(i => i !== optIdx)
                      : [...selectedOptions, optIdx];
                  } else {
                    next = [optIdx];
                  }
                  setSelectedOptions(next);
                  updateAnswers({ selectedOptionIndices: next });
                }}
                className={`w-full text-left p-3 rounded-xl border text-sm flex items-start gap-3 transition-colors ${stateStyle}`}
              >
                <div
                  className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 border ${
                    isSelected
                      ? 'bg-amber-600 border-amber-600 text-white'
                      : 'border-slate-300 bg-white text-slate-600'
                  }`}
                >
                  {String.fromCharCode(65 + optIdx)}
                </div>
                <div className="flex-1 leading-snug">{opt}</div>
                {showAnswer && isCorrect && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                )}
                {showAnswer && isSelected && !isCorrect && (
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* 2. True / False */}
      {question.type === 'true-false' && question.statements && (
        <div className="space-y-2.5 mb-4">
          <div className="hidden sm:grid grid-cols-12 gap-2 text-xs font-semibold text-slate-500 px-3 pb-1 border-b border-slate-100">
            <span className="col-span-8">Nhận định</span>
            <span className="col-span-4 text-center">Đánh giá của bạn</span>
          </div>
          {question.statements.map((stmt, sIdx) => {
            const currentVal = tfAnswers[sIdx];
            const isCorrect = stmt.isCorrect;

            return (
              <div
                key={sIdx}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm"
              >
                <div className="flex-1 text-slate-800 leading-snug">
                  <span className="font-semibold text-slate-500 mr-2">{sIdx + 1}.</span>
                  {stmt.statement}
                </div>
                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    disabled={mode === 'preview'}
                    onClick={() => {
                      const next = [...tfAnswers];
                      next[sIdx] = true;
                      setTfAnswers(next);
                      updateAnswers({ trueFalseAnswers: next });
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      currentVal === true
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    Đúng
                  </button>
                  <button
                    type="button"
                    disabled={mode === 'preview'}
                    onClick={() => {
                      const next = [...tfAnswers];
                      next[sIdx] = false;
                      setTfAnswers(next);
                      updateAnswers({ trueFalseAnswers: next });
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      currentVal === false
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    Sai
                  </button>
                  {showAnswer && (
                    <span className="ml-2 text-xs font-bold">
                      {isCorrect ? (
                        <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">Đúng</span>
                      ) : (
                        <span className="text-rose-700 bg-rose-100 px-2 py-0.5 rounded">Sai</span>
                      )}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. Matching (Cột A nối với cột B) */}
      {question.type === 'matching' && question.matchingPairs && (
        <div className="space-y-3 mb-4">
          <p className="text-xs text-slate-500 italic">Chọn nội dung ở cột B tương ứng với mỗi mục ở cột A:</p>
          <div className="space-y-2">
            {question.matchingPairs.map((pair, pIdx) => {
              const selectedRightIdx = matchingAns[pIdx];

              return (
                <div
                  key={pIdx}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col md:flex-row md:items-center justify-between gap-3 text-sm"
                >
                  <div className="flex-1 font-medium text-slate-800">
                    <span className="inline-block w-5 h-5 rounded-full bg-amber-100 text-amber-800 text-center text-xs font-bold mr-2">
                      {pIdx + 1}
                    </span>
                    {pair.left}
                  </div>
                  <div className="w-full md:w-64 shrink-0">
                    <select
                      disabled={mode === 'preview'}
                      value={selectedRightIdx !== undefined ? selectedRightIdx : ''}
                      onChange={(e) => {
                        const val = e.target.value === '' ? undefined : Number(e.target.value);
                        const next = { ...matchingAns };
                        if (val === undefined) {
                          delete next[pIdx];
                        } else {
                          next[pIdx] = val;
                        }
                        setMatchingAns(next);
                        updateAnswers({ matchingAnswers: next });
                      }}
                      className="w-full text-xs sm:text-sm p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                    >
                      <option value="">-- Ghép với cột B --</option>
                      {question.matchingPairs!.map((target, tIdx) => (
                        <option key={tIdx} value={tIdx}>
                          [{String.fromCharCode(65 + tIdx)}] {target.right}
                        </option>
                      ))}
                    </select>
                  </div>
                  {showAnswer && (
                    <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded">
                      Đáp án đúng: {pair.right}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Short Answer & Fill in blank */}
      {(question.type === 'short-answer' || question.type === 'fill-in-blank') && (
        <div className="space-y-2 mb-4">
          <label className="block text-xs font-medium text-slate-600">
            {question.type === 'short-answer' ? 'Nhập câu trả lời ngắn của bạn:' : 'Nhập từ/cụm từ còn thiếu:'}
          </label>
          <div className="relative">
            <input
              type="text"
              disabled={mode === 'preview'}
              placeholder="Gõ câu trả lời vào đây..."
              value={textAns}
              onChange={(e) => {
                const val = e.target.value;
                setTextAns(val);
                updateAnswers({ textAnswer: val });
              }}
              className="w-full p-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 bg-white"
            />
          </div>
          {showAnswer && question.acceptableAnswers && (
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
              <span className="font-semibold">Đáp án chấp nhận: </span>
              {question.acceptableAnswers.join(' / ')}
            </div>
          )}
        </div>
      )}

      {/* 5. Essay */}
      {question.type === 'essay' && (
        <div className="space-y-2.5 mb-4">
          <label className="block text-xs font-medium text-slate-600">
            Phần trả lời tự luận của học sinh:
          </label>
          <textarea
            disabled={mode === 'preview'}
            rows={4}
            placeholder="Soạn bài làm tự luận của em tại đây..."
            value={textAns}
            onChange={(e) => {
              const val = e.target.value;
              setTextAns(val);
              updateAnswers({ textAnswer: val });
            }}
            className="w-full p-3 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 bg-white"
          />
          {(showAnswer || mode === 'preview') && question.essayGuide && (
            <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-900">
              <div className="flex items-center gap-1.5 font-bold mb-1 text-amber-800">
                <FileText className="w-4 h-4" />
                <span>Gợi ý trả lời & Biểu điểm chấm:</span>
              </div>
              <p className="whitespace-pre-line leading-relaxed text-amber-950 font-normal">
                {question.essayGuide}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Practice Mode: Toggle Explanation & Hints */}
      {mode === 'practice' && question.explanation && (
        <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setShowExplanation(!showExplanation)}
            className="inline-flex items-center gap-1.5 text-xs text-amber-800 font-medium hover:underline self-start"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>{showExplanation ? 'Ẩn lời giải chi tiết' : 'Xem lời giải chi tiết & kiến thức mở rộng'}</span>
          </button>
          {showExplanation && (
            <div className="p-3 rounded-lg bg-amber-50/60 border border-amber-200/70 text-xs text-amber-900 leading-relaxed">
              <span className="font-semibold block mb-0.5">Lời giải & giải thích:</span>
              {question.explanation}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
