// Desativa o clique com o botão direito (Context Menu)
document.addEventListener('contextmenu', function(e) {
  e.preventDefault();
});

// Desativa atalhos de teclado comuns para ferramentas de developer
document.addEventListener('keydown', function(e) {
  // F12
  if (e.key === 'F12' || e.keyCode === 123) {
    e.preventDefault();
  }
  
  // Ctrl+Shift+I ou Cmd+Option+I (Inspecionar Elemento)
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.keyCode === 73)) {
    e.preventDefault();
  }

  // Ctrl+Shift+J ou Cmd+Option+J (Console)
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'J' || e.key === 'j' || e.keyCode === 74)) {
    e.preventDefault();
  }

  // Ctrl+Shift+C ou Cmd+Option+C (Inspecionar Elemento rápido)
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'C' || e.key === 'c' || e.keyCode === 67)) {
    e.preventDefault();
  }

  // Ctrl+U ou Cmd+Option+U (Ver Código Fonte)
  if ((e.ctrlKey || e.metaKey) && (e.key === 'U' || e.key === 'u' || e.keyCode === 85)) {
    e.preventDefault();
  }

  // Ctrl+S ou Cmd+S (Guardar Página)
  if ((e.ctrlKey || e.metaKey) && (e.key === 'S' || e.key === 's' || e.keyCode === 83)) {
    e.preventDefault();
  }
});