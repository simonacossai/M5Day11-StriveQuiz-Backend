const express = require("express")
const { check, validationResult } = require("express-validator")
const uniqid = require("uniqid")
const fs = require("fs")
const {writeFile,createReadStream} = require("fs-extra")
const path = require("path")
const router = express.Router()


const fileReader = (file) => {
  const myPath = path.join(__dirname, file);
  const myFileAsBuffer = fs.readFileSync(myPath);
  const fileAsString = myFileAsBuffer.toString();
  return JSON.parse(fileAsString);
};


router.post("/start", async (req, res, next) => {
  try {
    const questionfile = fileReader("questions.json");
    const examfile = fileReader("exams.json");

    function randomNoRepeats(array) {
      let copy = array.slice(0);
      return function () {
        if (copy.length < 1) {
          copy = array.slice(0);
        }
        let index = Math.floor(Math.random() * copy.length);
        let item = copy[index];
        copy.splice(index, 1);
        newExam.questions.push(item)
        return item;
      };
    }
    const newExam = {
      ...req.body,
      _id: uniqid(),
      examDate: new Date(),
      isCompleted: false,
      currentScore: 0,
      questions: []
    };

    const chooser = randomNoRepeats(questionfile);
    for (let i = 0; i < 5; i++) {
      await chooser();
    }
    let totalDuration = 0
     newExam.questions.map((item) => {
        totalDuration += parseInt(item.duration)
    })
    newExam.totalDuration = totalDuration
    examWithoutAnswers= newExam
    examfile.push(newExam);
    fs.writeFileSync(path.join(__dirname, "exams.json"), JSON.stringify(examfile));
    examWithoutAnswers.questions.map((v)=>  v.answers.map((e)=> delete e.isCorrect ));
    res.send(examWithoutAnswers);
  } catch (error) {
    console.log(error);
    next(error);
  }
});


/*
 > POST /exam/{id}/answer
  Answer to a question for the given exam {id}.
  Body: 
  {
      question: 0, // index of the question
      answer: 1, // index of the answer
  } // in this case, the answer for the first question is the second choice
  When the answer is provided, the result is kept into the exam and the score is updated accordingly.
  It should not be possible to answer the same question twice.
*/

router.post("/:id/answer", async (req, res, next) => {
  try {
    const examfile = fileReader("exams.json");
    const examIndex = examfile.findIndex(exam => exam._id === req.params.id)
    const examFound = examfile.find(exam => exam._id === req.params.id)
    if(!examfile[examIndex].questions[req.body.question].givenAnswer){
      const answer = examfile[examIndex].questions[req.body.question].answers[req.body.answer];
      examfile[examIndex].questions[req.body.question].givenAnswer = req.body.answer
   
      if (answer.isCorrect === true) {
        examFound.currentScore++;
      }
      examfile.splice(examIndex, 1);
      examfile.push(examFound)
      fs.writeFileSync(path.join(__dirname, "exams.json"), JSON.stringify(examfile));
      res.send("added");
    }else{
      res.send("you already answered to this question")
    }
    
  } catch (error) {
    console.log(error);
    next(error);
  }
});


/*
 > GET /exams/{id}
  Returns the information about the exam, including the current score. 
*/

router.get("/:id", async (req, res, next) => {
  try {
    const examfile = fileReader("exams.json");

    const examFound = examfile.find(
      exam => exam._id === req.params.id
    )

    if (examFound) {
      res.send(examFound)
    } else {
      const err = new Error()
      err.httpStatusCode = 404
      next(err)
    }
  } catch (error) {
    console.log(error);
    next(error)
  }
})



//get all the questions
router.get("/", async (req, res, next) => {
  try {
    const questionfile = fileReader("questions.json");
    res.send(questionfile);
  } catch (error) {
    console.log(error);
    next(error);
  }
});


router.post("/", async (req, res, next) => {
  try {
    const questionfile = fileReader("questions.json");
    const newQuestion = {
      ...req.body
    };
    questionfile.push(newQuestion);
    fs.writeFileSync(path.join(__dirname, "questions.json"), JSON.stringify(questionfile));
    res.status(201).send(newQuestion)
  } catch (error) {
    console.log(error);
    next(error);
  }
});

router.put("/:index", async(req, res, next)=>{
  try {
    const questionfile = fileReader("questions.json");
    const foundQuestion = questionfile[req.params.index]

    const updatedQuestion = [
      ...questionfile.slice(0, req.params.index),
      { ...questionfile[req.params.index], ...req.body },
      ...questionfile.slice(req.params.index + 1),
    ]
    fs.writeFileSync(path.join(__dirname, "questions.json"), JSON.stringify(updatedQuestion));
  res.send(updatedQuestion)
  } catch (error) {
    console.log(error);
    next(error);
  }
})

router.delete("/:index", async(req, res, next)=>{
  try {
    const questionfile = fileReader("questions.json");
    const questionToDelete = questionfile[req.params.index];

    questionfile.splice(req.params.index, 1);
    fs.writeFileSync(path.join(__dirname, "questions.json"), JSON.stringify(questionfile));
    res.send("deleted")
  } catch (error) {
    console.log(error);
    next(error);
  }
})


module.exports = router


