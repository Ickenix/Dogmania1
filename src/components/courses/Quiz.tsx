import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { CheckCircle, XCircle } from 'lucide-react';

interface Question {
  id: string;
  question: string;
  options: string[];
  correct_option: number;
}

const Quiz = () => {
  const { courseId } = useParams();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuestions();
  }, [courseId]);

  async function fetchQuestions() {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('course_id', courseId);

      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleAnswer = (optionIndex: number) => {
    setSelectedAnswer(optionIndex);
  };

  const handleNext = async () => {
    if (selectedAnswer === null) return;

    // Update score if answer is correct
    if (selectedAnswer === questions[currentQuestion].correct_option) {
      setScore(score + 1);
    }

    // Move to next question or show results
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
    } else {
      setShowResults(true);

      // Save quiz results
      try {
        const { error } = await supabase
          .from('quiz_results')
          .insert({
            quiz_id: questions[currentQuestion].id,
            score: score + (selectedAnswer === questions[currentQuestion].correct_option ? 1 : 0),
            passed: (score + (selectedAnswer === questions[currentQuestion].correct_option ? 1 : 0)) >= questions.length * 0.7
          });

        if (error) throw error;
      } catch (error) {
        console.error('Error saving quiz results:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Keine Quizfragen verfügbar.</p>
      </div>
    );
  }

  if (showResults) {
    const percentage = (score / questions.length) * 100;
    const passed = percentage >= 70;

    return (
      <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 text-center">
        {passed ? (
          <CheckCircle size={64} className="mx-auto mb-6 text-green-400" />
        ) : (
          <XCircle size={64} className="mx-auto mb-6 text-red-400" />
        )}
        <h2 className="text-2xl font-bold mb-4">
          Quiz abgeschlossen!
        </h2>
        <p className="text-xl mb-2">
          Dein Ergebnis: {score} von {questions.length} Punkten
        </p>
        <p className="text-lg mb-6">
          {percentage}% - {passed ? 'Bestanden!' : 'Nicht bestanden'}
        </p>
        <button
          onClick={() => {
            setCurrentQuestion(0);
            setSelectedAnswer(null);
            setScore(0);
            setShowResults(false);
          }}
          className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-500 transition-colors"
        >
          Quiz wiederholen
        </button>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];

  return (
    <div className="space-y-8">
      {/* Progress bar */}
      <div className="bg-white/5 backdrop-blur-lg rounded-full h-2 overflow-hidden">
        <div
          className="h-full bg-purple-600 transition-all duration-300"
          style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
        />
      </div>

      <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8">
        <div className="mb-8">
          <p className="text-sm text-gray-400 mb-2">
            Frage {currentQuestion + 1} von {questions.length}
          </p>
          <h3 className="text-xl font-semibold">{currentQ.question}</h3>
        </div>

        <div className="space-y-4">
          {currentQ.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswer(index)}
              className={`w-full text-left p-4 rounded-lg transition-all ${
                selectedAnswer === index
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/5 hover:bg-white/10'
              }`}
            >
              {option}
            </button>
          ))}
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleNext}
            disabled={selectedAnswer === null}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {currentQuestion === questions.length - 1 ? 'Quiz abschließen' : 'Nächste Frage'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Quiz;