import axios from "axios"
import { Adventure, Log } from './interface'

axios.defaults.baseURL = process.env.BASE_URL

function fixedEncodeURI(str: string) {
  return encodeURI(str).replace(/%5B/g, '[').replace(/%5D/g, ']');
}

export async function getAdventures() {
  try {
    console.log(axios.defaults.baseURL)
    return axios.get<Log[]>('api/adventure');
  } catch (e) {
    return null
  }
}

export async function getLogs(adventureName: string, latest: boolean = false, limit?: number) {
  const adventureIdRes = await axios.get(fixedEncodeURI(`api/adventure/id?name=${adventureName}`))
  if (adventureIdRes.data.id) {
    console.log(`api/adventure/${adventureIdRes.data.id}/logs?limit=${limit || ''}&latest=${latest || ''}`)
    return axios.get<Adventure[]>(`api/adventure/${adventureIdRes.data.id}/logs?limit=${limit || ''}&latest=${latest || ''}`)
  }
}

export async function search(adventureName: string, key: string, logName?: string) {
  return axios.get<Log[]>(fixedEncodeURI(`api/adventure/search?noContent=true&name=${adventureName}&key=${key}`))
} 

export async function searchInLog(adventureName: string, key: string, logName: string) {
  return axios.get<Log[]>(fixedEncodeURI(`api/adventure/search?name=${adventureName}&key=${key}&log=${logName}`))
}