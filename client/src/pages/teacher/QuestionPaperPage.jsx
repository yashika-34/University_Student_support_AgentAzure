import React, { useState } from 'react';
import api from '../../services/api.js';
import { Sparkles, FileText, Download, RefreshCw, Settings, BookOpen } from 'lucide-react';

const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: 'Easy (Conceptual)', color: 'var(--success)' },
  { value: 'medium', label: 'Medium (Applied)', color: 'var(--warning)' },
  { value: 'hard', label: 'Hard (Analytical)', color: 'var(--danger)' },
  { value: 'mixed', label: 'Mixed (Recommended)', color: 'var(--primary)' }
];

const EXAM_TYPES = ['Final Examination', 'Mid Semester', 'Unit Test', 'Internal Assessment', 'Quiz'];

const SAMPLE_COURSES = [
  { code: 'CS-301', name: 'Algorithms & Complexity' },
  { code: 'CS-305', name: 'Cloud Computing & Distributed Systems' },
  { code: 'CS-309', name: 'AI & Neural Networks' }
];

const QuestionPaperPage = () => {
  const [form, setForm] = useState({
    courseCode: 'CS-301',
    courseName: 'Algorithms & Complexity',
    topics: '',
    difficulty: 'mixed',
    totalMarks: 100,
    duration: '3 hours',
    mcqCount: 5,
    subjectiveCount: 5,
    examType: 'Final Examination'
  });
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleCourseSelect = (code) => {
    const course = SAMPLE_COURSES.find(c => c.code === code);
    if (course) setForm(f => ({ ...f, courseCode: code, courseName: course.name }));
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenerating(true);
    setError('');
    setResult(null);

    try {
      const res = await api.post('/teacher/question-paper', {
        ...form,
        topics: form.topics ? form.topics.split(',').map(t => t.trim()) : []
      });
      setResult(res.data.questionPaper);
    } catch (err) {
      // Demo fallback
      setResult({
        courseCode: form.courseCode,
        courseName: form.courseName,
        examType: form.examType,
        totalMarks: form.totalMarks,
        duration: form.duration,
        generatedAt: new Date().toISOString(),
        content: `**${form.examType.toUpperCase()}**
**Course: ${form.courseCode} — ${form.courseName}**
**Total Marks: ${form.totalMarks} | Duration: ${form.duration}**

---

**Instructions:**
1. Answer all sections. Read each question carefully.
2. Scientific calculators are permitted where applicable.
3. Start each section on a new answer book page.

---

**SECTION A: Multiple Choice Questions** *(20 Marks — 1 mark each)*

1. Which of the following sorting algorithms has the best average-case time complexity?
   - (a) Bubble Sort  (b) Merge Sort  (c) Insertion Sort  (d) Selection Sort

2. The time complexity of Binary Search in the worst case is:
   - (a) O(n)  (b) O(log n)  (c) O(n log n)  (d) O(1)

3. Which data structure is used in BFS traversal?
   - (a) Stack  (b) Queue  (c) Priority Queue  (d) Tree

4. Dynamic Programming is best applicable when a problem has:
   - (a) Optimal substructure only  (b) Overlapping subproblems only  (c) Both optimal substructure and overlapping subproblems  (d) Neither

5. NP-Complete problems are:
   - (a) Solvable in polynomial time  (b) Not verifiable in polynomial time  (c) In NP and every NP problem can be reduced to them  (d) Always unsolvable

*(Questions 6–20 continue on the attached sheet)*

---

**SECTION B: Short Answer Questions** *(30 Marks — 5 marks each)*

1. Explain the concept of divide and conquer with the example of Merge Sort. Trace Merge Sort on the array [5, 3, 8, 1, 9, 2]. *(5 marks)*

2. Define and differentiate between P, NP, and NP-Complete problems. Give one real-world example of each. *(5 marks)*

3. Write and explain the Bellman-Ford algorithm. When is it preferred over Dijkstra's algorithm? *(5 marks)*

4. Explain memoization and tabulation with a suitable example. Compare their space-time tradeoffs. *(5 marks)*

5. Describe the Master Theorem and apply it to find the time complexity of T(n) = 2T(n/2) + n. *(5 marks)*

6. What is an approximation algorithm? Describe the 2-approximation algorithm for the Vertex Cover problem. *(5 marks)*

---

**SECTION C: Long Answer / Problems** *(50 Marks)*

1. **(15 marks)** Given a weighted directed graph with 6 nodes and 8 edges, implement Dijkstra's algorithm step-by-step. Draw the final shortest path tree and state the complexity.

2. **(15 marks)** Design a dynamic programming solution to the 0/1 Knapsack Problem. Given:
   - Items: {(weight=2, value=6), (weight=2, value=10), (weight=3, value=12)}
   - Knapsack capacity = 5
   Fill the DP table, state the optimal solution and complexity analysis.

3. **(20 marks)** Comprehensive Problem:
   You are given a real-world scheduling problem modeled as a graph. 
   (a) Model it as a Graph Coloring problem and identify its NP-Complete nature.
   (b) Design a greedy approximation algorithm for it.
   (c) Analyze the approximation ratio of your algorithm.
   (d) Discuss alternative approaches if an exact solution were required.

---
*End of Question Paper — Best of Luck!*`
      });
    }
    setGenerating(false);
  };

  const handleDownload = () => {
    if (!result) return;
    const content = `${result.courseCode} — ${result.courseName}\n${result.examType}\nGenerated: ${new Date(result.generatedAt).toLocaleString()}\n\n${result.content}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${result.courseCode}_${result.examType.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-purple)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
          <Sparkles size={16} /> AI Question Paper Generator
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Question Paper Generator</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          Use Azure OpenAI to generate structured exam papers with marking schemes
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 1fr' : '1fr', gap: '1.5rem' }}>

        {/* Configuration Form */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Settings size={17} color="var(--primary)" /> Paper Configuration
          </h3>

          <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {/* Course */}
            <div className="form-group">
              <label className="form-label">Course</label>
              <select className="form-select" value={form.courseCode} onChange={e => handleCourseSelect(e.target.value)}>
                {SAMPLE_COURSES.map(c => (
                  <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
                ))}
              </select>
            </div>

            {/* Exam Type */}
            <div className="form-group">
              <label className="form-label">Exam Type</label>
              <select className="form-select" value={form.examType} onChange={e => setForm(f => ({...f, examType: e.target.value}))}>
                {EXAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Topics */}
            <div className="form-group">
              <label className="form-label">Topics (comma-separated, leave blank for all)</label>
              <input className="form-input" placeholder="e.g. Sorting, Dynamic Programming, Graph Algorithms" value={form.topics} onChange={e => setForm(f => ({...f, topics: e.target.value}))} />
            </div>

            {/* Difficulty */}
            <div className="form-group">
              <label className="form-label">Difficulty Level</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                {DIFFICULTY_OPTIONS.map(opt => (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => setForm(f => ({...f, difficulty: opt.value}))}
                    style={{
                      padding: '0.6rem',
                      borderRadius: 'var(--radius-sm)',
                      border: `1px solid ${form.difficulty === opt.value ? opt.color : 'var(--border-subtle)'}`,
                      background: form.difficulty === opt.value ? `${opt.color}22` : 'var(--bg-input)',
                      color: form.difficulty === opt.value ? opt.color : 'var(--text-secondary)',
                      fontWeight: form.difficulty === opt.value ? 600 : 400,
                      cursor: 'pointer',
                      fontSize: '0.82rem',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Marks & Duration */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Total Marks</label>
                <input className="form-input" type="number" min={20} max={200} value={form.totalMarks} onChange={e => setForm(f => ({...f, totalMarks: parseInt(e.target.value) || 0}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Duration</label>
                <select className="form-select" value={form.duration} onChange={e => setForm(f => ({...f, duration: e.target.value}))}>
                  {['1 hour', '1.5 hours', '2 hours', '3 hours', '4 hours'].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
            
            {/* Question Breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">MCQ Count</label>
                <input className="form-input" type="number" min={0} max={50} value={form.mcqCount} onChange={e => setForm(f => ({...f, mcqCount: parseInt(e.target.value) || 0}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Subjective Qs Count</label>
                <input className="form-input" type="number" min={0} max={30} value={form.subjectiveCount} onChange={e => setForm(f => ({...f, subjectiveCount: parseInt(e.target.value) || 0}))} />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.85rem', marginTop: '0.5rem', fontSize: '1rem' }}
              disabled={generating}
            >
              {generating ? (
                <><span className="animate-spin" style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }} /> Generating with Azure AI...</>
              ) : (
                <><Sparkles size={17} /> Generate Question Paper</>
              )}
            </button>
          </form>
        </div>

        {/* Generated Paper */}
        {result && (
          <div className="glass-panel animate-fade-in" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={17} color="var(--success)" /> Generated Paper
              </h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }} onClick={() => setResult(null)}>
                  <RefreshCw size={14} /> Regenerate
                </button>
                <button className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }} onClick={handleDownload}>
                  <Download size={14} /> Download
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span className="badge badge-primary">{result.courseCode}</span>
              <span className="badge badge-purple">{result.examType}</span>
              <span className="badge badge-cyan">{result.totalMarks} Marks</span>
              <span className="badge badge-success">{result.duration}</span>
            </div>

            <div style={{
              background: 'var(--bg-input)',
              borderRadius: 'var(--radius-sm)',
              padding: '1.25rem',
              maxHeight: '600px',
              overflowY: 'auto',
              fontFamily: 'monospace',
              fontSize: '0.82rem',
              lineHeight: '1.7',
              color: 'var(--text-primary)',
              whiteSpace: 'pre-wrap',
              border: '1px solid var(--border-subtle)'
            }}>
              {result.content}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionPaperPage;
