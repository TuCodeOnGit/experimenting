<script setup lang="ts">
import { ref } from 'vue';
import { PROFILE, MESSAGE } from './constants';
import { useWebSocket } from '@vueuse/core';

const url = process.env.NODE_ENV === "production" ? '/ws' : "ws://127.0.0.1:3000/ws"

const {status, ws, send} = useWebSocket(url)
const profile = ref({
  id: '',
  name: ''
})
const clientMessage = ref("")
const serverMessage = ref("")
const userList = ref([])

if (ws.value) {
  ws.value.onmessage = handleOnMessage
}

function handleOnMessage(e: MessageEvent) {
  const { type, data } = JSON.parse(e.data)
  switch (type) {
    case PROFILE:
      profile.value = { ...data }
      break;
    case MESSAGE:
      serverMessage.value = data
      break;
    default:
      break;
  }
}
function getSocketMessage(message: string) {
  return JSON.stringify({
    type: MESSAGE,
    data: message
  })
}
</script>

<template>
  <h1>What does WebSocket actually do?</h1>
  <ol>
    <li>
      <h4>Two-way communicating</h4>
      <ul>
        <li>Status: {{ status }}</li>
        <li>Your profile:
          <ul>Id: {{ profile.id }}</ul>
          <ul>Name<small>(Pokemon name)</small>: {{ profile.name }}</ul>
        </li>
      </ul>
    </li>
    <li>
      <h4>Send message to server</h4>
      <input type="text" v-model="clientMessage"><button @click="send(getSocketMessage(clientMessage))">Send</button>
    </li>
    <li>
      <h4>Receive message from the server</h4>
      <p>{{ serverMessage }}</p>
    </li>
  </ol>

  <h1>Signal Server for WebRTC</h1>

  <figure>
    <figcaption>User List</figcaption>
    <ul>
      <li v-for="user in userList">
        {{ user }}
      </li>
    </ul>
  </figure>  
</template>
