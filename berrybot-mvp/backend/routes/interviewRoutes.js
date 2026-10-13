const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // Temp folder for audio files

const {
    generateQuestions,
    transcribeAudio,
    getNextQuestion,
    evaluateInterview
} = require('../controllers/interviewController');

// POST /api/interview/questions -> Starts interview, gets first question
router.post('/questions', generateQuestions);

// POST /api/interview/transcribe -> Uploads audio file, returns text (STT)
router.post('/transcribe', upload.single('audio'), transcribeAudio);

// POST /api/interview/next -> Sends chat history, gets dynamic next question
router.post('/next', getNextQuestion);

// POST /api/interview/evaluate -> Evaluates the final transcript
router.post('/evaluate', evaluateInterview);

module.exports = router;
