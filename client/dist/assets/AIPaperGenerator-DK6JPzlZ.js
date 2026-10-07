import{g as k,j as e}from"./index-CUGZE3tX.js";import{r as n}from"./vendor-CpSE_mEW.js";import{v as S,aP as J,af as X,aQ as A,aR as Z,Q as ee,aS as te,aT as F,C as ae,W as B,aU as re,R as se,aV as ne,aJ as ie,F as le,aW as oe,al as de}from"./icons-DYyRKdkT.js";import{M as ce}from"./index-CMG3ZWfU.js";function xe(){const[o,g]=n.useState([]),[C,E]=n.useState(""),[z,W]=n.useState("Mid-Term"),[T,R]=n.useState("Mixed"),[N,$]=n.useState(100),[y,L]=n.useState(10),[f,O]=n.useState(5),[h,G]=n.useState(""),[b,D]=n.useState(!1),[I,u]=n.useState(""),[r,x]=n.useState(null),[d,v]=n.useState("paper"),[c,m]=n.useState(-1),[j,P]=n.useState(!1),[M,U]=n.useState([]);n.useEffect(()=>{w()},[]);const w=async()=>{var t;try{const a=await k.get("/teacher/question-paper/my-papers");(t=a.data)!=null&&t.data&&U(a.data.data)}catch(a){console.error(a)}},V=t=>{if(t.preventDefault(),t.dataTransfer.files&&t.dataTransfer.files.length>0){const a=Array.from(t.dataTransfer.files).filter(i=>i.type==="application/pdf");a.length>0?g(i=>[...i,...a]):u("Only PDF files are allowed.")}},Q=async t=>{var a,i,l;if(t.preventDefault(),o.length===0){u("Please upload at least one syllabus PDF.");return}D(!0),u("");try{const s=new FormData;o.forEach(Y=>s.append("syllabus",Y)),s.append("title",C),s.append("examType",z),s.append("difficulty",T),s.append("totalMarks",N),s.append("objectiveCount",y),s.append("subjectiveCount",f),h&&s.append("specificTopics",h);const p=await k.post("/teacher/question-paper/upload",s,{headers:{"Content-Type":"multipart/form-data"}});(a=p.data)!=null&&a.data&&(x(p.data.data),m(-1),w())}catch(s){u(((l=(i=s.response)==null?void 0:i.data)==null?void 0:l.message)||"Failed to generate paper. Please try again.")}finally{D(!1)}},q=async()=>{var t,a,i;if(r!=null&&r._id){P(!0);try{const l=await k.post(`/teacher/question-paper/${r._id}/variant`,{objectiveCount:y,subjectiveCount:f});(t=l.data)!=null&&t.data&&(x(l.data.data),m(l.data.data.variants.length-1),w())}catch(l){alert(((i=(a=l.response)==null?void 0:a.data)==null?void 0:i.message)||"Failed to generate variant")}finally{P(!1)}}},K=t=>{x(t),m(-1),v("paper")},H=()=>{if(!r)return;const t=c>=0?r.variants[c]:r,a=d==="paper"?t.generatedPaper:t.answerKey,i=`${r.title.replace(/\s+/g,"_")}_${d}.md`,l=new Blob([a],{type:"text/markdown"}),s=URL.createObjectURL(l),p=document.createElement("a");p.href=s,p.download=i,p.click(),URL.revokeObjectURL(s)},_=()=>{if(!r)return;const t=c>=0?r.variants[c]:r,a=d==="paper"?t.generatedPaper:t.answerKey,i=`${r.title} — ${d==="paper"?"Examination Paper":"Model Answer Key"}`,l=window.open("","_blank");if(!l){alert("Please enable pop-ups in your browser to view and save the exam paper as PDF.");return}const s=`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${i}</title>
  <style>
    @page { size: A4; margin: 18mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      color: #111827;
      background: #ffffff;
      margin: 0;
      padding: 24px;
      line-height: 1.6;
      font-size: 11pt;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #1e3a8a;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .header h1 {
      margin: 0;
      font-size: 17pt;
      color: #1e3a8a;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .header h2 {
      margin: 4px 0 0 0;
      font-size: 13pt;
      color: #374151;
      font-weight: 600;
    }
    .meta-box {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-bottom: 20px;
      font-size: 10pt;
      background: #f8fafc;
      padding: 10px 14px;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
    }
    .paper-text {
      white-space: pre-wrap;
      font-size: 11pt;
      line-height: 1.7;
    }
    h2, h3, h4 { color: #1e3a8a; margin-top: 16px; margin-bottom: 8px; }
    hr { border: 0; border-top: 1px solid #e2e8f0; margin: 16px 0; }
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>University Examination Division</h1>
    <h2>${r.title}</h2>
    <div style="font-size: 10pt; color: #4b5563; margin-top: 4px;">
      ${r.examType} &bull; Academic Session 2026
    </div>
  </div>
  <div class="meta-box">
    <div><strong>Max Marks:</strong> ${r.totalMarks}</div>
    <div><strong>Difficulty:</strong> ${r.difficulty}</div>
    <div><strong>Duration:</strong> 3 Hours</div>
    <div><strong>Section:</strong> ${d==="paper"?"Official Question Paper":"Model Answer Key"}</div>
    <div><strong>Date:</strong> ${new Date().toLocaleDateString()}</div>
    <div><strong>Approved:</strong> Examination Board</div>
  </div>
  <div class="paper-text">${a.replace(/</g,"&lt;").replace(/>/g,"&gt;")}</div>
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 250);
    };
  <\/script>
</body>
</html>`;l.document.open(),l.document.write(s),l.document.close()};return e.jsxs("div",{className:"animate-fade-in",style:{display:"grid",gridTemplateColumns:"1fr 320px",gap:"2rem",alignItems:"start"},children:[e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"1.5rem"},children:[e.jsxs("div",{children:[e.jsx("h1",{style:{fontSize:"2.4rem",fontWeight:800,marginBottom:"0.5rem",background:"var(--primary-gradient)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",display:"inline-block"},children:"AI Question Paper Generator"}),e.jsx("p",{style:{color:"var(--text-secondary)",fontSize:"1.05rem"},children:"Upload your syllabus PDF and automatically generate a balanced examination paper with answer keys using Azure OpenAI."})]}),r?e.jsxs("div",{className:"glass-panel",style:{padding:"2rem"},children:[e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.5rem",paddingBottom:"1.5rem",borderBottom:"1px solid var(--border-subtle)"},children:[e.jsxs("div",{children:[e.jsx("h2",{style:{fontSize:"1.5rem",fontWeight:800,margin:"0 0 0.4rem 0"},children:r.title}),e.jsxs("div",{style:{color:"var(--text-secondary)",display:"flex",gap:"1rem",fontSize:"0.9rem"},children:[e.jsx("span",{style:{fontWeight:600,color:"var(--primary)"},children:r.examType}),e.jsxs("span",{style:{display:"flex",alignItems:"center",gap:"0.25rem"},children:[e.jsx(S,{size:14})," ",r.difficulty]}),e.jsxs("span",{style:{display:"flex",alignItems:"center",gap:"0.25rem"},children:[e.jsx(A,{size:14})," ",r.totalMarks," Marks"]})]})]}),e.jsxs("div",{style:{display:"flex",gap:"0.5rem",flexWrap:"wrap",alignItems:"center"},children:[r.variants&&r.variants.length>0&&e.jsxs("select",{className:"form-input",style:{padding:"0.3rem 0.5rem",width:"auto",marginRight:"0.5rem"},value:c,onChange:t=>m(Number(t.target.value)),children:[e.jsx("option",{value:-1,children:"Original Paper"}),r.variants.map((t,a)=>e.jsx("option",{value:a,children:t.variantName},a))]}),e.jsxs("button",{onClick:q,disabled:j,className:"btn",style:{padding:"0.5rem 1rem",display:"flex",alignItems:"center",gap:"0.5rem",background:"linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",color:"white",border:"none"},children:[j?e.jsx(B,{size:16,className:"animate-spin"}):e.jsx(se,{size:16}),j?"Generating...":"Generate Variant"]}),e.jsxs("button",{onClick:_,className:"btn btn-primary",style:{padding:"0.5rem 1rem",display:"flex",alignItems:"center",gap:"0.5rem",background:"linear-gradient(135deg, #10b981 0%, #059669 100%)",border:"none"},children:[e.jsx(ne,{size:16})," Export to PDF"]}),e.jsxs("button",{onClick:H,className:"btn btn-secondary",style:{padding:"0.5rem 1rem",display:"flex",alignItems:"center",gap:"0.5rem"},children:[e.jsx(ie,{size:16})," Download .md"]}),e.jsx("button",{onClick:()=>{x(null),g([]),m(-1)},className:"btn btn-secondary",style:{padding:"0.5rem 1rem"},children:"New Paper"})]})]}),e.jsxs("div",{style:{display:"flex",gap:"1.5rem",marginBottom:"1.5rem",borderBottom:"1px solid var(--border-subtle)",flexWrap:"wrap"},children:[e.jsxs("button",{onClick:()=>v("paper"),style:{background:"none",border:"none",cursor:"pointer",padding:"0.5rem 0.25rem",fontSize:"1.05rem",fontWeight:600,color:d==="paper"?"var(--primary)":"var(--text-muted)",borderBottom:d==="paper"?"3px solid var(--primary)":"3px solid transparent",display:"flex",alignItems:"center",gap:"0.5rem",transition:"all 0.2s"},children:[e.jsx(le,{size:18})," Generated Paper"]}),e.jsxs("button",{onClick:()=>v("key"),style:{background:"none",border:"none",cursor:"pointer",padding:"0.5rem 0.25rem",fontSize:"1.05rem",fontWeight:600,color:d==="key"?"var(--accent-purple)":"var(--text-muted)",borderBottom:d==="key"?"3px solid var(--accent-purple)":"3px solid transparent",display:"flex",alignItems:"center",gap:"0.5rem",transition:"all 0.2s"},children:[e.jsx(oe,{size:18})," Answer Key"]})]}),e.jsx("div",{className:"markdown-body printable-area",style:{color:"var(--text-primary)",lineHeight:1.7,fontSize:"1.05rem",minHeight:"500px"},children:e.jsx(ce,{children:d==="paper"?c>=0?r.variants[c].generatedPaper:r.generatedPaper:c>=0?r.variants[c].answerKey:r.answerKey})})]}):e.jsxs("form",{onSubmit:Q,className:"glass-panel",style:{padding:"2rem"},children:[e.jsxs("h2",{style:{fontSize:"1.3rem",fontWeight:700,marginBottom:"1.5rem",display:"flex",alignItems:"center",gap:"0.5rem"},children:[e.jsx(S,{size:20,color:"var(--primary)"})," Exam Configuration"]}),I&&e.jsx("div",{style:{padding:"1rem",background:"var(--danger-bg)",color:"var(--danger)",borderRadius:"var(--radius-sm)",marginBottom:"1.5rem",border:"1px solid var(--danger)"},children:I}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1.5rem",marginBottom:"2rem"},children:[e.jsxs("div",{className:"form-group",style:{margin:0},children:[e.jsxs("label",{className:"form-label",style:{display:"flex",alignItems:"center",gap:"0.4rem"},children:[e.jsx(J,{size:14,color:"var(--text-muted)"})," Subject / Title"]}),e.jsx("input",{required:!0,className:"form-input",style:{background:"var(--bg-input)"},value:C,onChange:t=>E(t.target.value),placeholder:"e.g. Advanced Data Structures"})]}),e.jsxs("div",{className:"form-group",style:{margin:0},children:[e.jsxs("label",{className:"form-label",style:{display:"flex",alignItems:"center",gap:"0.4rem"},children:[e.jsx(X,{size:14,color:"var(--text-muted)"})," Exam Type"]}),e.jsxs("select",{className:"form-input",style:{background:"var(--bg-input)"},value:z,onChange:t=>W(t.target.value),children:[e.jsx("option",{children:"Mid-Term"}),e.jsx("option",{children:"End-Term"}),e.jsx("option",{children:"Quiz"}),e.jsx("option",{children:"Assignment"}),e.jsx("option",{children:"Practice Test"})]})]}),e.jsxs("div",{className:"form-group",style:{margin:0},children:[e.jsxs("label",{className:"form-label",style:{display:"flex",alignItems:"center",gap:"0.4rem"},children:[e.jsx(A,{size:14,color:"var(--text-muted)"})," Total Marks"]}),e.jsx("input",{type:"number",required:!0,className:"form-input",style:{background:"var(--bg-input)"},value:N,onChange:t=>$(t.target.value)})]}),e.jsxs("div",{className:"form-group",style:{margin:0},children:[e.jsxs("label",{className:"form-label",style:{display:"flex",alignItems:"center",gap:"0.4rem"},children:[e.jsx(Z,{size:14,color:"var(--text-muted)"})," Objective (MCQs) Count"]}),e.jsx("input",{type:"number",required:!0,className:"form-input",style:{background:"var(--bg-input)"},value:y,onChange:t=>L(t.target.value)})]}),e.jsxs("div",{className:"form-group",style:{margin:0},children:[e.jsxs("label",{className:"form-label",style:{display:"flex",alignItems:"center",gap:"0.4rem"},children:[e.jsx(S,{size:14,color:"var(--text-muted)"})," Difficulty Level"]}),e.jsxs("select",{className:"form-input",style:{background:"var(--bg-input)"},value:T,onChange:t=>R(t.target.value),children:[e.jsx("option",{children:"Mixed (Recommended)"}),e.jsx("option",{children:"Easy"}),e.jsx("option",{children:"Medium"}),e.jsx("option",{children:"Hard"})]})]}),e.jsxs("div",{className:"form-group",style:{margin:0},children:[e.jsxs("label",{className:"form-label",style:{display:"flex",alignItems:"center",gap:"0.4rem"},children:[e.jsx(ee,{size:14,color:"var(--text-muted)"})," Subjective Questions Count"]}),e.jsx("input",{type:"number",required:!0,className:"form-input",style:{background:"var(--bg-input)"},value:f,onChange:t=>O(t.target.value)})]}),e.jsxs("div",{className:"form-group",style:{margin:0,gridColumn:"1 / -1"},children:[e.jsxs("label",{className:"form-label",style:{display:"flex",alignItems:"center",gap:"0.4rem"},children:[e.jsx(te,{size:14,color:"var(--text-muted)"})," Specific Topics to Focus On (Optional)"]}),e.jsx("input",{className:"form-input",style:{background:"var(--bg-input)"},value:h,onChange:t=>G(t.target.value),placeholder:"e.g. Dynamic Programming, Trees, Graph Algorithms"}),e.jsx("div",{style:{fontSize:"0.8rem",color:"var(--text-muted)",marginTop:"0.35rem"},children:"If left blank, the AI will generate questions covering the entire syllabus."})]})]}),e.jsxs("div",{className:"form-group",style:{margin:"0 0 2.5rem 0"},children:[e.jsxs("label",{className:"form-label",style:{display:"flex",alignItems:"center",gap:"0.4rem"},children:[e.jsx(F,{size:14,color:"var(--text-muted)"})," Upload Syllabus & Materials (Multiple PDFs allowed)"]}),e.jsxs("div",{onDragOver:t=>t.preventDefault(),onDrop:V,style:{border:o.length>0?"2px solid var(--success)":"2px dashed var(--border-focus)",borderRadius:"12px",padding:"3.5rem 2rem",textAlign:"center",background:o.length>0?"rgba(16, 185, 129, 0.05)":"var(--bg-input)",cursor:"pointer",transition:"all 0.3s ease",position:"relative"},onClick:()=>document.getElementById("syllabus-upload").click(),onMouseEnter:t=>o.length===0&&(t.currentTarget.style.borderColor="var(--primary)"),onMouseLeave:t=>o.length===0&&(t.currentTarget.style.borderColor="var(--border-focus)"),children:[e.jsx("input",{type:"file",id:"syllabus-upload",accept:"application/pdf",multiple:!0,style:{display:"none"},onChange:t=>{var a;return((a=t.target.files)==null?void 0:a.length)&&g(i=>[...i,...Array.from(t.target.files)])}}),o.length>0?e.jsx(ae,{size:48,color:"var(--success)",style:{margin:"0 auto 1rem",opacity:.9,animation:"pulse 2s infinite"}}):e.jsx(F,{size:48,color:"var(--primary)",style:{margin:"0 auto 1rem",opacity:.8}}),e.jsx("div",{style:{fontSize:"1.15rem",fontWeight:700,color:o.length>0?"var(--success)":"var(--text-primary)",marginBottom:"0.5rem"},children:o.length>0?`${o.length} file(s) selected`:"Drag & drop syllabus PDFs here"}),e.jsx("div",{style:{color:"var(--text-muted)",fontSize:"0.95rem"},children:o.length>0?o.map(t=>t.name).join(", "):"or click to browse from computer"}),o.length>0&&e.jsx("div",{style:{marginTop:"1rem"},children:e.jsx("button",{type:"button",onClick:t=>{t.stopPropagation(),g([])},className:"btn btn-sm",style:{color:"var(--danger)",fontSize:"0.8rem",border:"1px solid var(--danger)"},children:"Clear Files"})})]})]}),e.jsxs("button",{type:"submit",disabled:b,className:"btn btn-primary",style:{width:"100%",padding:"1rem",fontSize:"1.1rem",display:"flex",justifyContent:"center",alignItems:"center",gap:"0.5rem"},children:[b?e.jsx(B,{size:20,className:"animate-spin"}):e.jsx(re,{size:20}),b?"AI is extracting text & generating paper...":"Generate AI Question Paper"]})]})]}),e.jsxs("div",{className:"glass-panel",style:{padding:"1.5rem"},children:[e.jsxs("h3",{style:{fontSize:"1.1rem",fontWeight:700,marginBottom:"1.25rem",display:"flex",alignItems:"center",gap:"0.5rem"},children:[e.jsx(de,{size:18,color:"var(--primary)"})," Paper Repository"]}),M.length===0?e.jsx("p",{style:{color:"var(--text-muted)",fontSize:"0.9rem",textAlign:"center",padding:"2rem 0"},children:"No papers generated yet."}):e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:"0.75rem"},children:M.map(t=>e.jsxs("div",{onClick:()=>K(t),style:{padding:"1rem",background:"var(--bg-input)",border:"1px solid var(--border-subtle)",borderRadius:"var(--radius-sm)",cursor:"pointer",transition:"all 0.2s",display:"flex",flexDirection:"column",gap:"0.4rem",boxShadow:"0 2px 4px rgba(0,0,0,0.02)"},onMouseEnter:a=>{a.currentTarget.style.borderColor="var(--primary)",a.currentTarget.style.transform="translateY(-2px)",a.currentTarget.style.boxShadow="0 4px 12px rgba(0,0,0,0.05)"},onMouseLeave:a=>{a.currentTarget.style.borderColor="var(--border-subtle)",a.currentTarget.style.transform="translateY(0)",a.currentTarget.style.boxShadow="0 2px 4px rgba(0,0,0,0.02)"},children:[e.jsx("div",{style:{fontWeight:600,fontSize:"0.95rem",color:"var(--text-primary)"},children:t.title}),e.jsxs("div",{style:{fontSize:"0.75rem",color:"var(--text-muted)",display:"flex",justifyContent:"space-between",alignItems:"center"},children:[e.jsx("span",{style:{fontWeight:500,color:"var(--primary)"},children:t.examType}),e.jsx("span",{children:new Date(t.createdAt).toLocaleDateString()})]})]},t._id))})]}),e.jsx("style",{children:`
        @media print {
          body * { visibility: hidden; }
          .printable-area, .printable-area * { visibility: visible; }
          .printable-area { position: absolute; left: 0; top: 0; width: 100%; padding: 2rem; color: #000; background: #fff; }
          .glass-panel { box-shadow: none; border: none; }
        }
      `})]})}export{xe as default};
