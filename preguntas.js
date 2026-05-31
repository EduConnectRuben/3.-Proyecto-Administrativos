// =========================================
// Esperar a que el contenido del DOM se cargue completamente
// =========================================
document.addEventListener('DOMContentLoaded', () => {
    // =========================================
    // Seleccionar elementos del DOM
    // =========================================
    const questionBlocks = document.querySelectorAll('.question-block'); // Bloques de preguntas
    const totalQuestionsDisplay = document.getElementById('total-questions'); // Muestra total de preguntas
    const totalQuestionsFinalDisplay = document.getElementById('total-questions-final'); // Total final de preguntas
    const currentScoreDisplay = document.getElementById('current-score'); // Muestra el puntaje actual
    const prevQuestionBtn = document.getElementById('prev-question-btn'); // Botón para la pregunta anterior
    const nextQuestionBtn = document.getElementById('next-question-btn'); // Botón para la siguiente pregunta
    const quizFinishedMessage = document.getElementById('quiz-finished'); // Mensaje de finalización del quiz
    const finalScoreDisplay = document.getElementById('final-score'); // Muestra el puntaje final
    const finalMessageDisplay = document.getElementById('final-message'); // Mensaje final basado en el puntaje
    const finalTimeMessageDisplay = document.getElementById('final-time-message'); // Muestra el tiempo total
    const progressFill = document.getElementById('progress-fill'); // Barra de progreso
    const reviewButton = document.getElementById('review-button'); // Botón para revisar respuestas
    const reviewSection = document.getElementById('review-section'); // Sección de revisión
    const reviewQuestionsContainer = document.getElementById('review-questions'); // Contenedor de preguntas revisadas
    const currentTimerDisplay = document.getElementById('current-timer'); // Muestra el temporizador actual
    const totalTimeDisplay = document.getElementById('total-time'); // Muestra el tiempo total
    const questionNumberDisplay = document.getElementById('question-number-display'); // Muestra el número de pregunta actual
    const restartQuizBtn = document.getElementById('restart-quiz-btn'); // Botón para reiniciar el quiz
    const goToMenuBtn = document.getElementById('go-to-menu-btn'); // Botón para volver al menú

    // =========================================
    // Variables para gestionar el estado del quiz
    // =========================================
    let currentQuestionIndex = 0; // Índice de la pregunta actual
    let score = 0; // Puntaje del usuario
    let totalElapsedTime = 0; // Tiempo total transcurrido en segundos
    let timePerQuestion = 60; // 60 segundos para cada pregunta (se mantiene igual)
    let timer; // Temporizador para la pregunta actual
    let totalTimer; // Temporizador total

    // Cargar los sonidos (sonidos para respuestas correctas/incorrectas por pregunta)
    const correctSound = new Audio('/sound/correcto.mp3'); // Sonido para respuesta correcta
    const incorrectSound = new Audio('/sound/incorrecto.mp3'); // Sonido para respuesta incorrecta

    // Cargar los sonidos para el resultado final del quiz
    const successQuizSound = new Audio('/sound/aprobado.mp3'); // Sonido para quiz aprobado (>=51)
    const failQuizSound = new Audio('/sound/reprobado.mp3');     // Sonido para quiz reprobado (<=50)

    // =========================================
    // Inicializar el total de preguntas
    // =========================================
    const totalQuestions = questionBlocks.length; // Total de preguntas
    totalQuestionsDisplay.textContent = totalQuestions; // Mostrar total de preguntas
    totalQuestionsFinalDisplay.textContent = totalQuestions; // Mostrar total final de preguntas

    // Inicializar el estado de las preguntas
    const questionStates = Array(totalQuestions).fill(null).map(() => ({
        selected: null, // Respuesta seleccionada
        checked: false // Estado de si la pregunta ha sido respondida
    }));

   


    // =========================================
    // Funciones de temporizador
    // =========================================
    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        const formattedMinutes = String(minutes).padStart(2, '0');
        const formattedSeconds = String(remainingSeconds).padStart(2, '0');
        return `${formattedMinutes}m ${formattedSeconds}s`;
    }

    function startTotalTimer() {
        // Iniciar el temporizador total
        totalTimer = setInterval(() => {
            totalElapsedTime++; // Incrementar el tiempo total en segundos
            totalTimeDisplay.textContent = `T. total: ${formatTime(totalElapsedTime)}`; // Mostrar tiempo total formateado
        }, 1000);
    }

    function startTimer() {
        // Iniciar el temporizador para la pregunta actual
        clearInterval(timer); // Limpiar temporizador anterior
        let timeLeft = timePerQuestion; // Tiempo restante para la pregunta
        currentTimerDisplay.textContent = `T. x preg.: ${timeLeft}s`; // Mostrar tiempo restante
        
        timer = setInterval(() => {
            timeLeft--; // Decrementar tiempo
            currentTimerDisplay.textContent = `T. x preg.: ${timeLeft}s`; // Actualizar visualización
            if (timeLeft <= 0) {
                clearInterval(timer); // Limpiar temporizador si se agota
                handleTimeOut(); // Manejar tiempo agotado
            }
        }, 1000);
    }

    // =========================================
    // Manejo de tiempo agotado
    // =========================================
    function handleTimeOut() {
        questionStates[currentQuestionIndex].checked = true; // Marcar la pregunta como respondida
        
        if (currentQuestionIndex === totalQuestions - 1) {
            finishQuiz(); // Finalizar el quiz si es la última pregunta
        } else {
            currentQuestionIndex++; // Ir a la siguiente pregunta
            renderQuestion(currentQuestionIndex); // Renderizar la nueva pregunta
        }
        updateNavigationButtons(); // Actualizar botones de navegación
    }

    // =========================================
    // Finalizar el quiz
    // =========================================
    function finishQuiz() {
        clearInterval(timer); // Limpiar temporizador de la pregunta
        clearInterval(totalTimer); // Limpiar temporizador total
        
        if (questionBlocks[currentQuestionIndex]) {
            questionBlocks[currentQuestionIndex].style.display = 'none'; // Ocultar la pregunta final
        }
        
        quizFinishedMessage.style.display = 'block'; // Mostrar mensaje de finalización
        finalScoreDisplay.textContent = score; // Mostrar puntaje final

        const percentageScore = (score / totalQuestions) * 100; // Calcular porcentaje de aciertos

        // Mensajes según el resultado y reproducción de sonido
        if (percentageScore >= 51) {
            finalMessageDisplay.textContent = `¡Felicidades, aprobaste la prueba!`;
            finalMessageDisplay.style.color = '#f3cf06'; // Color para éxito
            successQuizSound.play(); // Reproducir sonido de éxito
        } else {
            finalMessageDisplay.textContent = `Lo siento, no aprobaste la prueba. ¡Inténtalo de nuevo!`;
            finalMessageDisplay.style.color = 'red'; // Color para fallo
            failQuizSound.play(); // Reproducir sonido de fallo
        }

        // Mostrar tiempo total en formato minutos y segundos
        finalTimeMessageDisplay.textContent = `Hiciste un tiempo total de: ${formatTime(totalElapsedTime)}.`;
        finalTimeMessageDisplay.style.color = '#862305'; // Color para el tiempo

        // Ocultar botones de navegación y mostrar botón de revisión
        prevQuestionBtn.style.display = 'none';
        nextQuestionBtn.style.display = 'none';
        reviewButton.style.display = 'inline-block'; // Mostrar botón de revisión
    }

    // =========================================
    // Renderizar pregunta actual
    // =========================================
    function renderQuestion(index) {
        questionBlocks.forEach(block => block.classList.remove('active')); // Limpiar estado activo
        const currentQuestionBlock = questionBlocks[index]; // Obtener bloque de pregunta actual

        if (!currentQuestionBlock) {
            finishQuiz(); // Finalizar el quiz si no hay pregunta
            return;
        }

        currentQuestionBlock.classList.add('active'); // Marcar pregunta como activa
        questionNumberDisplay.textContent = `Pregunta: ${currentQuestionIndex + 1} / ${totalQuestions}`; // Mostrar número de pregunta
        startTimer(); // Iniciar temporizador para la pregunta
        updateNavigationButtons(); // Actualizar botones de navegación
        updateProgress(); // Actualizar barra de progreso
        updateScoreDisplay(); // Actualizar puntaje
        
        const radios = currentQuestionBlock.querySelectorAll('input[type="radio"]'); // Obtener opciones de respuesta
        radios.forEach(radio => {
            radio.disabled = questionStates[currentQuestionIndex].checked; // Deshabilitar si ya fue respondida
            if (radio.value === questionStates[currentQuestionIndex].selected) {
                radio.checked = true; // Marcar opción seleccionada
            } else {
                radio.checked = false; // Desmarcar opción
            }

            const label = radio.closest('label'); // Obtener etiqueta del radio
            label.classList.remove('correct-answer', 'incorrect-selected'); // Limpiar clases de respuesta
            if (questionStates[currentQuestionIndex].checked && questionStates[currentQuestionIndex].selected !== null) {
                if (radio.value === questionStates[currentQuestionIndex].selected) {
                    if (questionStates[currentQuestionIndex].selected === correctAnswers[currentQuestionBlock.id]) {
                        label.classList.add('correct-answer'); // Marcar como correcta
                    } else {
                        label.classList.add('incorrect-selected'); // Marcar como incorrecta
                    }
                } else if (radio.value === correctAnswers[currentQuestionBlock.id]) {
                    label.classList.add('correct-answer'); // Marcar respuesta correcta
                }
            }
        });
    }

    // =========================================
    // Actualizar botones de navegación
    // =========================================
    function updateNavigationButtons() {
        prevQuestionBtn.disabled = currentQuestionIndex === 0; // Deshabilitar botón anterior si es la primera pregunta
        nextQuestionBtn.disabled = !questionStates[currentQuestionIndex].checked; // Deshabilitar si no se ha respondido
        nextQuestionBtn.textContent = currentQuestionIndex === totalQuestions - 1 ? 'Terminar' : 'Siguiente'; // Cambiar texto del botón
    }

    // =========================================
    // Actualizar puntaje
    // =========================================
    function updateScoreDisplay() {
        currentScoreDisplay.textContent = score; // Mostrar puntaje actual
    }

    // =========================================
    // Actualizar barra de progreso
    // =========================================
    function updateProgress() {
        const percentage = ((currentQuestionIndex) / totalQuestions) * 100; // Calcular porcentaje de progreso
        progressFill.style.width = percentage + '%'; // Actualizar ancho de la barra de progreso
    }

    // =========================================
    // Inicialización del quiz
    // =========================================
    renderQuestion(currentQuestionIndex); // Renderizar la primera pregunta
    startTotalTimer(); // Iniciar temporizador total

    // =========================================
    // Eventos de botones
    // =========================================
    prevQuestionBtn.addEventListener('click', () => {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--; // Decrementar índice de pregunta
            renderQuestion(currentQuestionIndex); // Renderizar pregunta anterior
        }
    });

    nextQuestionBtn.addEventListener('click', () => {
        questionStates[currentQuestionIndex].checked = true; // Marcar pregunta como respondida
        
        if (currentQuestionIndex < totalQuestions - 1) {
            currentQuestionIndex++; // Incrementar índice de pregunta
            renderQuestion(currentQuestionIndex); // Renderizar siguiente pregunta
        } else {
            finishQuiz(); // Finalizar el quiz si es la última pregunta
        }
    });

    questionBlocks.forEach(block => {
        const radios = block.querySelectorAll('input[type="radio"]'); // Obtener opciones de respuesta
        radios.forEach(radio => {
            radio.addEventListener('change', () => {
                const questionId = block.id; // Obtener ID de la pregunta
                const selectedValue = radio.value; // Valor seleccionado

                // Verificar si la respuesta es correcta y reproducir el sonido
                if (selectedValue === correctAnswers[questionId]) {
                    correctSound.play(); // Reproducir sonido correcto
                } else {
                    incorrectSound.play(); // Reproducir sonido incorrecto
                }
                
                // Actualizar el puntaje solo si la pregunta NO ha sido respondida aún
                if (questionStates[currentQuestionIndex].selected === null) {
                    if (selectedValue === correctAnswers[questionId]) {
                        score++; // Incrementar puntaje
                    }
                } else {
                    // Manejar cambios en la respuesta
                    if (questionStates[currentQuestionIndex].selected === correctAnswers[questionId] && selectedValue !== correctAnswers[questionId]) {
                        score--; // Decrementar puntaje si se cambia de correcta a incorrecta
                    } else if (questionStates[currentQuestionIndex].selected !== correctAnswers[questionId] && selectedValue === correctAnswers[questionId]) {
                        score++; // Incrementar puntaje si se cambia de incorrecta a correcta
                    }
                }
                
                questionStates[currentQuestionIndex].selected = selectedValue; // Guardar respuesta seleccionada
                questionStates[currentQuestionIndex].checked = true; // Marcar pregunta como respondida

                radios.forEach(r => r.disabled = true); // Deshabilitar opciones

                block.querySelectorAll('.options label').forEach(label => {
                    label.classList.remove('correct-answer', 'incorrect-selected'); // Limpiar clases de respuesta
                });

                if (selectedValue === correctAnswers[questionId]) {
                    radio.closest('label').classList.add('correct-answer'); // Marcar etiqueta correcta
                } else {
                    radio.closest('label').classList.add('incorrect-selected'); // Marcar etiqueta incorrecta
                    const correctLabel = Array.from(radios).find(r => r.value === correctAnswers[questionId]).closest('label');
                    if (correctLabel) {
                        correctLabel.classList.add('correct-answer'); // Marcar etiqueta correcta
                    }
                }
                updateScoreDisplay(); // Actualizar puntaje en pantalla
                updateNavigationButtons(); // Actualizar botones de navegación
            });
        });
    });

    reviewButton.addEventListener('click', () => {
        reviewSection.style.display = 'block'; // Mostrar sección de revisión
        reviewQuestionsContainer.innerHTML = ''; // Limpiar contenedor de revisión

        // Renderizar preguntas revisadas
        questionStates.forEach((state, index) => {
            const questionBlock = questionBlocks[index];
            const questionText = questionBlock.querySelector('.question-text').innerText; // Obtener texto de la pregunta
            const options = Array.from(questionBlock.querySelectorAll('.options label')); // Obtener opciones
            const selectedAnswer = state.selected; // Respuesta seleccionada
            const correctAnswer = correctAnswers[questionBlock.id]; // Respuesta correcta
            
            let selectedOptionText = 'No respondida'; // Texto para respuesta no respondida
            if (selectedAnswer !== null) {
                const foundSelected = options.find(option => option.querySelector('input[type="radio"]').value === selectedAnswer);
                if (foundSelected) {
                    selectedOptionText = foundSelected.textContent.trim().substring(foundSelected.textContent.indexOf(')') + 1).trim(); 
                }
            }

            const correctOptionText = options.find(option => option.querySelector('input[type="radio"]').value === correctAnswer).textContent.trim().substring(options.find(option => option.querySelector('input[type="radio"]').value === correctAnswer).textContent.indexOf(')') + 1).trim();

            const reviewDiv = document.createElement('div');
            reviewDiv.classList.add('review-question');

            // =========================================
            // opcion para ver respuesta (Tu respuesta: Y ✓ Respuesta correcta) cambiar cuando sea necesario
            // =========================================

            reviewDiv.innerHTML = `<strong class="question">${questionText}</strong><br>
                ${selectedAnswer !== null ? 
                    `<span class="${selectedAnswer === correctAnswer ? 'correct' : 'incorrect'}">
                        ${selectedAnswer === correctAnswer ? '✓' : 'X'} : ${selectedOptionText}
                    </span><br>` :
                    `<span class="incorrect">X No respondiste esta pregunta.</span><br>`
                }
                ${selectedAnswer !== correctAnswer ? `<span class="correct">✓ : ${correctOptionText}</span>` : ''}`;
            
            reviewQuestionsContainer.appendChild(reviewDiv); // Añadir revisión al contenedor
        });

        reviewSection.scrollIntoView({ behavior: 'smooth' }); // Desplazarse a la sección de revisión
    });

    restartQuizBtn.addEventListener('click', () => {
        location.reload(); // Reiniciar el quiz
    });

    goToMenuBtn.addEventListener('click', () => {
        window.location.href = '/index.html'; // Redirigir al menú
    });
});
