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
      totalDuration: 30,
      currentScore: 0,
      questions: []
    };
    const chooser = randomNoRepeats(questionfile);
    for (let i = 0; i < 5; i++) {
      await chooser();
    }
    examfile.push(newExam);
    fs.writeFileSync(path.join(__dirname, "exams.json"), JSON.stringify(examfile));
    res.send("added");
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
    if (examIndex !== -1) {
      const answer = examfile[examIndex].questions[req.body.question].answers[req.body.answer];
      examfile[examIndex].questions[req.body.question].givenAnswer = req.body.answer
    } else {
      res.send("Couldn't find this exam");
    }
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

module.exports = router

