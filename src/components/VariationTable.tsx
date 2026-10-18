import React from 'react';
import { VariationTableData } from '../math/types';
import { MathView } from './MathView';

interface VariationTableProps {
  data: VariationTableData;
  restrictedInterval?: { min: number; max: number };
}

export const VariationTable: React.FC<VariationTableProps> = ({ data }) => {
  const { milestones, segments } = data;

  if (!milestones || milestones.length === 0) {
    return (
      <div className="p-4 text-center text-slate-600 bg-white border border-slate-300 rounded-xl">
        Không có dữ liệu bảng biến thiên.
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto bg-white border-2 border-slate-800 rounded-xl shadow-md text-slate-900">
      <div className="min-w-[640px] p-5 font-sans select-none bg-white">
        <table className="w-full border-collapse text-center">
          <thead>
            {/* ROW 1: x */}
            <tr className="border-b-2 border-slate-800">
              <th className="w-16 py-3.5 px-3 text-base font-extrabold text-emerald-700 border-r-2 border-slate-800 bg-slate-50">
                <MathView math="x" />
              </th>
              {milestones.map((m, idx) => (
                <React.Fragment key={`m-x-${idx}`}>
                  <td className="px-3 py-3.5 font-bold text-slate-900 text-sm">
                    <MathView math={m.label} />
                  </td>
                  {idx < segments.length && (
                    <td className="px-6 py-3.5 text-slate-400 text-xs">
                      {/* Spacing */}
                    </td>
                  )}
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* ROW 2: y' */}
            <tr className="border-b-2 border-slate-800">
              <th className="py-3.5 px-3 text-base font-extrabold text-emerald-700 border-r-2 border-slate-800 bg-slate-50">
                <MathView math="y'" />
              </th>
              {milestones.map((m, idx) => (
                <React.Fragment key={`m-yp-${idx}`}>
                  <td className="px-3 py-3.5 font-bold text-sm">
                    {m.yPrimeValue === 'undefined_double' ? (
                      <span className="inline-block text-slate-900 font-black tracking-tighter text-base">
                        ║
                      </span>
                    ) : m.yPrimeValue === 'undefined_single' ? (
                      <span className="text-slate-300"></span>
                    ) : (
                      <span className="text-slate-900 font-bold">
                        <MathView math={m.yPrimeValue} />
                      </span>
                    )}
                  </td>
                  {idx < segments.length && (
                    <td className="px-6 py-3.5 font-extrabold text-base">
                      {segments[idx].sign === '+' ? (
                        <span className="text-emerald-700 font-black">+</span>
                      ) : (
                        <span className="text-rose-600 font-black">−</span>
                      )}
                    </td>
                  )}
                </React.Fragment>
              ))}
            </tr>

            {/* ROW 3: y */}
            <tr className="h-36">
              <th className="py-4 px-3 text-base font-extrabold text-emerald-700 border-r-2 border-slate-800 bg-slate-50 align-middle">
                <MathView math="y" />
              </th>
              <td colSpan={milestones.length + segments.length} className="p-0 relative bg-white">
                <div className="relative w-full h-36 flex items-stretch">
                  {milestones.map((m, idx) => {
                    const isLast = idx === milestones.length - 1;
                    const seg = segments[idx];

                    return (
                      <React.Fragment key={`m-y-${idx}`}>
                        {/* Milestone Column */}
                        <div className="flex-1 flex flex-col justify-between items-center relative py-2.5">
                          {m.isUndefined ? (
                            <div className="absolute inset-y-0 flex items-center justify-center">
                              {/* Standard double vertical line in high contrast */}
                              <div className="w-2 h-full border-x-2 border-slate-800"></div>
                            </div>
                          ) : null}

                          {/* Top position value (Local maximum or +inf) */}
                          <div className="text-xs font-bold text-slate-900 z-10">
                            {m.yPrimeValue === '0' && idx > 0 && segments[idx - 1]?.direction === 'up' ? (
                              <span className="text-emerald-800 font-extrabold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                <MathView math={m.yValue || ''} />
                              </span>
                            ) : m.yRightLimit && m.yRightLimit.includes('+') ? (
                              <div className="translate-x-3 text-slate-900 font-bold">
                                <MathView math={m.yRightLimit} />
                              </div>
                            ) : m.yLeftLimit && m.yLeftLimit.includes('+') ? (
                              <div className="-translate-x-3 text-slate-900 font-bold">
                                <MathView math={m.yLeftLimit} />
                              </div>
                            ) : m.label === '+\\infty' && m.yValue?.includes('+') ? (
                              <MathView math={m.yValue} />
                            ) : m.label === '-\\infty' && m.yValue?.includes('+') ? (
                              <MathView math={m.yValue} />
                            ) : (
                              <span className="invisible text-[10px]">0</span>
                            )}
                          </div>

                          {/* Middle value if neither top nor bottom */}
                          <div className="text-xs font-semibold text-slate-800 z-10">
                            {m.isHole && m.yValue ? (
                              <div className="bg-amber-100 px-1.5 py-0.5 border border-amber-400 rounded text-[11px] text-amber-900 font-bold">
                                <MathView math={m.yValue} />
                              </div>
                            ) : (m.label === '-\\infty' || m.label === '+\\infty') &&
                              !m.yValue?.includes('\\infty') &&
                              m.yValue ? (
                              <span className="text-slate-900 font-bold">
                                <MathView math={m.yValue} />
                              </span>
                            ) : null}
                          </div>

                          {/* Bottom position value (Local minimum or -inf) */}
                          <div className="text-xs font-bold text-slate-900 z-10">
                            {m.yPrimeValue === '0' && idx > 0 && segments[idx - 1]?.direction === 'down' ? (
                              <span className="text-emerald-800 font-extrabold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                <MathView math={m.yValue || ''} />
                              </span>
                            ) : m.yRightLimit && m.yRightLimit.includes('-') ? (
                              <div className="translate-x-3 text-slate-900 font-bold">
                                <MathView math={m.yRightLimit} />
                              </div>
                            ) : m.yLeftLimit && m.yLeftLimit.includes('-') ? (
                              <div className="-translate-x-3 text-slate-900 font-bold">
                                <MathView math={m.yLeftLimit} />
                              </div>
                            ) : m.label === '+\\infty' && m.yValue?.includes('-') ? (
                              <MathView math={m.yValue} />
                            ) : m.label === '-\\infty' && m.yValue?.includes('-') ? (
                              <MathView math={m.yValue} />
                            ) : (
                              <span className="invisible text-[10px]">0</span>
                            )}
                          </div>
                        </div>

                        {/* Segment Column with Direction Arrow */}
                        {!isLast && seg && (
                          <div className="flex-2 flex items-center justify-center relative px-2">
                            <svg className="w-full h-28 overflow-visible" viewBox="0 0 100 60" preserveAspectRatio="none">
                              <defs>
                                <marker
                                  id={`arrow-white-${idx}`}
                                  viewBox="0 0 10 10"
                                  refX="6"
                                  refY="5"
                                  markerWidth="6"
                                  markerHeight="6"
                                  orient="auto-start-reverse"
                                >
                                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#047857" />
                                </marker>
                              </defs>
                              {seg.direction === 'up' ? (
                                <line
                                  x1="8"
                                  y1="50"
                                  x2="92"
                                  y2="10"
                                  stroke="#047857"
                                  strokeWidth="2.4"
                                  markerEnd={`url(#arrow-white-${idx})`}
                                />
                              ) : (
                                <line
                                  x1="8"
                                  y1="10"
                                  x2="92"
                                  y2="50"
                                  stroke="#047857"
                                  strokeWidth="2.4"
                                  markerEnd={`url(#arrow-white-${idx})`}
                                />
                              )}
                            </svg>
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
