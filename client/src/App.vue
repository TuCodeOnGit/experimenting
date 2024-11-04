<script setup lang="ts">
import { ref } from 'vue';
import { PROFILE, MESSAGE, PUBLISH } from '../../server/constants';
import { useWebSocket } from '@vueuse/core';
import { Sprites } from '@pkmn/img';

type User = {
  id: string,
  name: string,
  image?: string
}
const url = process.env.NODE_ENV === "production" ? '/ws' : "ws://127.0.0.1:3000/ws"

const { status, ws, send } = useWebSocket(url)
const profile = ref<User>({
  id: '',
  name: ''
})
const clientMessage = ref("")
const serverMessage = ref("")
const userList = ref<User[]>([])

if (ws.value) {
  ws.value.onmessage = handleOnMessage
}

function handleOnMessage(e: MessageEvent) {
  const { type, data } = JSON.parse(e.data)
  switch (type) {
    case PROFILE:
      profile.value = { ...data, image: getPokeImgUrl(data.name) }
      break;
    case MESSAGE:
      serverMessage.value = data
      break;
    case PUBLISH:
      userList.value = data
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
function getPokeImgUrl(name: string) {
  return Sprites.getPokemon(name).url
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
          <ul>Name<small>(Pokemon name)</small>: {{ profile.name }} <img v-bind:src="profile.image" alt="pkm" /></ul>
        </li>
      </ul>
    </li>
    <li>
      <h4>Send message to server</h4>
      <form @submit.prevent="send(getSocketMessage(clientMessage))">
        <input type="text" v-model="clientMessage"><button type="submit">Send</button>
      </form>
    </li>
    <li>
      <h4>Receive message from the server</h4>
      <p>{{ serverMessage }}</p>
    </li>
    <li>
      <h4>Signal Server for WebRTC</h4>
      <figure>
        <figcaption>User List</figcaption>
        <ul>
          <li v-for="user in userList.filter(u => u.id !== profile.id)">
            {{ user.name }} <img width="30" v-bind:src="getPokeImgUrl(user.name)" alt="pokemon" />
            <button type="button">Connect</button>
          </li>
        </ul>
      </figure>
    </li>
  </ol>

  <h1>What does WebRTC actually do?</h1>
  <ol>
    <li>
      <h4>Data Channel</h4>
      <textarea value="abc" cols="100" rows="10" disabled></textarea>
      <form><input type="text" placeholder="Your message"> <button type="submit">🚀<small>(enter)</small></button></form>
    </li>
  </ol>
</template>
