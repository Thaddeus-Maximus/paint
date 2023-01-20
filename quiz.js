const template = document.createElement("template");
template.innerHTML = `
<link href="style.css" rel="stylesheet" type="text/css">  
<div class="sl-quiz-element">
    <div class="meta">
        <h1 class="name"></h1>
    </div>
    <p class="question"></p>
    <div class="options" id="answers"></div>
    <div class="notify"></div>
    <button class="submit">Next Question</button>
    <button class="restart">Start Over</button>
    <input class="next_que" hidden>
</div>
`;

let generating = false;
let message_to_encrypt = '';

class SLQuizComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    this.shadowRoot.querySelector(".name").innerText = this.getAttribute("name");
    this.counter = 0;

    fetch(this.getAttribute("json-file"))
      .then((res) => res.json())
      .then((manifest) => {
        let questions = manifest.questions;

        let ques_counter = 0;
        let submitted_answers = [];

        const que_div = this.shadowRoot.querySelector(".question")
        que_div.innerText =`Q1/${questions.length}: ${questions[0].question}`;
        const total_ques = questions.length;

        const answers_count = questions[0].options.length;
        let answers_html = ``;
        questions[ques_counter].options.map((ans, index) => {
          answers_html += `<label><input type="radio" name="answer" value="${index + 1}" group="answers">${ans}</label>`;
        });
        this.shadowRoot.querySelector(".options").innerHTML = answers_html;


        this.shadowRoot.querySelector(".restart").addEventListener("click", (e) => {
          ques_counter = 0;
          submitted_answers = [];

          que_div.innerText =`Q1/${questions.length}: ${questions[0].question}`;

          answers_html = ``;
          questions[ques_counter].options.map((ans, index) => {
            answers_html += `<label><input type="radio" name="answer" value="${index + 1}" group="answers">${ans}</label>`;
          });
          this.shadowRoot.querySelector(".options").innerHTML = answers_html;
        });
        
        this.shadowRoot.querySelector(".submit").addEventListener("click", (e) => {
            const answer_element = this.shadowRoot.querySelector("input[name=answer]:checked");
            submitted_answers.push(answer_element.value);

            if(ques_counter<total_ques-1){
              ques_counter++;
              que_div.innerText =`Q${ques_counter+1}/${questions.length}: ${questions[ques_counter].question}`;
              answers_html = "";
              questions[ques_counter].options.map((ans, index) => {
                answers_html += `<label><input type="radio" name="answer" value="${index + 1}" group="answers">${ans}</label>`;
              });
              this.shadowRoot.querySelector(".options").innerHTML = answers_html;
            } else {
              const password = JSON.stringify(submitted_answers);

              if (generating) {
                let secret = sjcl.encrypt(password, message_to_encrypt);
                console.log("Paste the next output into the json file under the 'secret' key:");
                console.log(secret);
              } else {
                try {
                  let msg = sjcl.decrypt(password, JSON.stringify(manifest.secret));

                  que_div.innerText = "YOU PASSED!";
                  this.shadowRoot.querySelector(".options").innerHTML = msg;
                  this.shadowRoot.querySelector(".restart").style.display = 'none';
                  this.shadowRoot.querySelector(".submit").style.display = 'none';
                } catch (error) {
                  console.log(error);
                  que_div.innerText = "YOU FAILED.";
                  this.shadowRoot.querySelector(".options").innerHTML = 'Try again.';
                }
              }              
            }
          });
      });
  }
  disconnectedCallback() {
    this.shadowRoot.querySelector("button").removeEventListener();
  }
}
window.customElements.define("sl-quiz-element", SLQuizComponent);

function generateSecret(message) {
  generating = true;
  message_to_encrypt = message;
}