const form=document.querySelector("#beta-feedback-form");
const category=document.querySelector("#feedback-category");
const step=document.querySelector("#feedback-step");
const message=document.querySelector("#feedback-result");
const copy=document.querySelector("#feedback-copy");
const status=document.querySelector("#feedback-status");
const preview=document.querySelector("#feedback-preview");
const submit=document.querySelector("#feedback-submit-link");
let report="";
function prepare(event){
  event.preventDefault();
  const description=message.value.trim();
  if(description.length<10){
    status.textContent="Please describe what happened in at least 10 characters.";
    message.focus();return;
  }
  report=["ApartmentFinder beta feedback","Category: "+category.value,"Area: "+step.value,"",
    "Issue or suggestion:",description,"","Expected outcome: (optional — add before submitting)",
    "","Please do not include personal, financial, or account information."].join("\n");
  preview.textContent=report;preview.hidden=false;copy.disabled=false;
  const title="Beta feedback: "+category.value+" — "+step.value;
  submit.href="https://github.com/Esoham/ApartmentFinder/issues/new?title="+encodeURIComponent(title)+"&body="+encodeURIComponent(report);
  submit.hidden=false;
  status.textContent="Draft prepared on this device. Copy it or continue to the public GitHub issue form. Nothing has been submitted yet.";
}
form.addEventListener("submit",prepare);
for(const control of [category,step,message]){
  control.addEventListener("input",()=>{
    if(!report)return;
    report="";copy.disabled=true;preview.hidden=true;submit.hidden=true;
    status.textContent="Your draft changed. Prepare the report again before copying or submitting.";
  });
}
copy.addEventListener("click",async()=>{
  if(!report)return;
  try{
    await navigator.clipboard.writeText(report);
    status.textContent="Report copied. To submit it, use the GitHub issue form; copying alone does not send feedback.";
  }catch{
    status.textContent="Clipboard access was blocked. Select the report text below and copy it manually.";
  }
});
