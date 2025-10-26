const elevador = document.getElementById("elevador");
const botoesPainel = document.querySelectorAll(".container_painel .btnPainel");
const botoesAndar = document.querySelectorAll(".btnAndar");
const saidaPainel = document.getElementById("saidaPainel");

const portas = {
  1: document.getElementById("porta1"),
  2: document.getElementById("porta2"),
  3: document.getElementById("porta3"),
  4: document.getElementById("porta4"),
};


const alturaAndar = 150;
const tempoEspera = 5000;
let fila = [];
let andarAtual = 1;
let movimentando = false;

const SistemaSom = {
  ativo: false,
  sons: {
    fundo: new Audio("./assets/fundo.mp3"),
    elevadorAndando: new Audio("./assets/elevador_andando.mp3"),
    portas: new Audio("./assets/portas.mp3"),
    ding: new Audio("./assets/ding.mp3"),
    cliqueBotao: new Audio("./assets/clique_botao.mp3"),
    erro: new Audio("./assets/erro.mp3"),
  },

  iniciar() {
    this.sons.fundo.volume = 0.05;
    this.sons.fundo.loop = true;
    this.sons.elevadorAndando.volume = 0.4;
    this.sons.portas.volume = 0.2;
    this.sons.ding.volume = 0.5;
    this.sons.cliqueBotao.volume = 0.4;
  },

  alternar() {
    this.ativo = !this.ativo;
    if (this.ativo) {
      this.sons.fundo.play();
      saidaPainel.textContent = "SOM ON";
    } else {
      this.pararTodos();
      saidaPainel.textContent = "SOM OFF";
    }
  },

  pararTodos() {
    for (const som of Object.values(this.sons)) {
      som.pause();
      som.currentTime = 0;
    }
  },

  tocar(nome) {
    if (!this.ativo) return;
    const som = this.sons[nome];
    if (!som) return;
    som.currentTime = 0;
    som.play().catch(() => {});
  },
};

SistemaSom.iniciar();


document.querySelector(".container_painel").addEventListener("click", (e) => {
  if (!e.target.classList.contains("btnPainel")) return;
  const texto = e.target.textContent.trim();

  if (texto === "SOM") {
    SistemaSom.alternar();
    return;
  }

  const andar = parseInt(texto);
  if (!isNaN(andar)) {
    SistemaSom.tocar("cliqueBotao");
    adicionarAFila(andar);
  }
});

document.getElementById("btnContainer").addEventListener("click", (e) => {
  if (!e.target.classList.contains("btnAndar")) return;
  const todos = [...document.querySelectorAll(".btnContainerAndar")];
  const index = todos.indexOf(e.target.closest(".btnContainerAndar"));
  const andar = 4 - index;
  SistemaSom.tocar("cliqueBotao");
  adicionarAFila(andar);
});

function adicionarAFila(andar) {
  const portaAtual = portas[andarAtual];
  const portaAberta = portaAtual && portaAtual.classList.contains("porta-abrindo");
  if (andar === andarAtual && portaAberta) {
    saidaPainel.textContent = "PORTA ABERTA";
    SistemaSom.tocar("erro");
    return;
  }

  if (!fila.includes(andar)) {
    fila.push(andar);
    acenderLuz(andar);
    saidaPainel.textContent = `CHAMADA ${andar}`;
    SistemaSom.tocar("cliqueBotao");
    processarFila();
  }
}


function acenderLuz(andar) {
  botoesPainel.forEach(btn => {
    if (parseInt(btn.textContent) === andar) {
      btn.classList.add("ligado");
    }
  });

  const todos = [...document.querySelectorAll(".btnContainerAndar")];
  const index = 4 - andar;
  const painelAndar = todos[index];
  if (painelAndar) {
    painelAndar.querySelectorAll(".btnAndar").forEach(btn => btn.classList.add("ligado"));
  }
}

function apagarLuz(andar) {
  botoesPainel.forEach(btn => {
    if (parseInt(btn.textContent) === andar) {
      btn.classList.remove("ligado");
    }
  });

  const todos = [...document.querySelectorAll(".btnContainerAndar")];
  const index = 4 - andar;
  const painelAndar = todos[index];
  if (painelAndar) {
    painelAndar.querySelectorAll(".btnAndar").forEach(btn => btn.classList.remove("ligado"));
  }
}

function processarFila() {
  if (movimentando || fila.length === 0) return;
  movimentando = true;
  const destino = fila.shift();
  moverElevador(destino);
}

function moverElevador(destino) {
  const portaAtual = portas[andarAtual];
  const portaAberta = portaAtual && portaAtual.classList.contains("porta-abrindo");

  if (portaAberta && andarAtual === destino) {
    saidaPainel.textContent = "PORTA ABERTA";
    SistemaSom.tocar("erro");
    movimentando = false;
    return;
  }

  if (andarAtual === destino) {
    apagarLuz(destino);
    movimentando = false;
    saidaPainel.textContent = "INICIAR";
    processarFila();
    return;
  }

  saidaPainel.textContent = `FECHANDO ${andarAtual}`;
  const deslocamento = (destino - 1) * alturaAndar;

  Object.values(portas).forEach(p => p.dataset.bloqueada = "true");
  const portaDestino = portas[destino];
  const portaAnterior = portas[andarAtual];

  if (portaAnterior) {
    fecharPortas(andarAtual);
    SistemaSom.tocar("portas");
  }

  setTimeout(() => {
    acenderLuz(destino);
    saidaPainel.textContent = "ELEVADOR ANDANDO";
    elevador.style.transition = "transform 2s ease-in-out";
    elevador.style.transform = `translateY(-${deslocamento}px)`;
    SistemaSom.tocar("elevadorAndando");
  }, 1000);

  setTimeout(() => {
    andarAtual = destino;
    SistemaSom.sons.elevadorAndando.pause();
    SistemaSom.tocar("ding");
    abrirPortas(destino);
    SistemaSom.tocar("portas");
    apagarLuz(destino);
    if (portaDestino) portaDestino.dataset.bloqueada = "false";
    saidaPainel.textContent = `CHEGOU ${destino}`;

    setTimeout(() => {
      saidaPainel.textContent = `FECHANDO ${destino}`;
      fecharPortas(destino);
      SistemaSom.tocar("portas");

      setTimeout(() => {
        movimentando = false;
        processarFila();

        if (fila.length === 0 && andarAtual !== 1) {
          fila.push(1);
          processarFila();
        } else if (fila.length === 0) {
          saidaPainel.textContent = "INICIAR";
        }
      }, 1000);
    }, tempoEspera);
  }, 3000);
}


function abrirPortas(andar) {
  const porta = portas[andar];
  if (!porta) return;
  porta.classList.remove("porta-fechando");
  void porta.offsetWidth;
  porta.classList.add("porta-abrindo");
}

function fecharPortas(andar) {
  const porta = portas[andar];
  if (!porta) return;
  porta.classList.remove("porta-abrindo");
  void porta.offsetWidth;
  porta.classList.add("porta-fechando");
}


abrirPortas(1);

function abrirPortasManualmente() {
  const porta = portas[andarAtual];
  if (porta.dataset.bloqueada === "true") {
    saidaPainel.textContent = "BLOQUEADA";
    SistemaSom.tocar("erro");
    return;
  }
  abrirPortas(andarAtual);
  SistemaSom.tocar("portas");
  saidaPainel.textContent = `ABRINDO ${andarAtual}`;
}

function fecharPortasManualmente() {
  fecharPortas(andarAtual);
  SistemaSom.tocar("portas");
  saidaPainel.textContent = `FECHANDO ${andarAtual}`;
}
