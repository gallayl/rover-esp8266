import { WebSocketService } from './sockets.js'

/** @type HTMLInputElement | null */
const textInput = document.getElementById('txbuff')

/** @type HTMLButtonElement */
const sendBtn = document.getElementById('sendBtn')

/** @type HTMLTextAreaElement */
const textArea = document.getElementById('rxConsole')

const socket = new WebSocketService({
  host: window.location.hostname,
  port: 80,
  onOpen: () => {
    textInput.removeAttribute('disabled')
    textInput.focus()
    sendBtn.removeAttribute('disabled')
  },
  onClose: () => {
    textInput.setAttribute('disabled', 'disabled')
    sendBtn.setAttribute('disabled', 'disabled')
  },
  onMessage: evt => {
    textArea.value += '<< ' + evt.data + '\r\n'
    textArea.scrollTop = textArea.scrollHeight
  },
})

const storageKey = 'ROVER_CONSOLE_HISTORY'
const storedHistory = localStorage.getItem(storageKey)
const history = storedHistory ? JSON.parse(storedHistory) : []
let historyPointer = history.length + 1

function enterpressed() {
  textArea.value += '>> ' + textInput.value + '\r\n'
  textArea.scrollTop = textArea.scrollHeight
  history.push(textInput.value)
  historyPointer = history.length + 1
  socket.send(textInput.value)
  textInput.value = ''
}

textInput.onkeydown = event => {
  if (event.key === 'Enter') {
    enterpressed()
  } else if (event.key === 'ArrowUp') {
    historyPointer -= 1
    textInput.value = history[historyPointer] || ''
  } else if (event.key === 'ArrowDown') {
    historyPointer += 1
    textInput.value = history[historyPointer] || ''
  } else {
    historyPointer = history.length + 1
  }
}

sendBtn.onclick = () => enterpressed()
