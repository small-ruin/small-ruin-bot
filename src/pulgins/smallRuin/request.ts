import axios from "axios"
import { Adventure, Log } from './interface'

axios.defaults.baseURL = process.env.BASE_URL

export async function getAdventures() {
  try {
    return axios.get<Log[]>('/api/adventure');
  } catch (e) {
    return null
  }
}

export async function getLogs(adventureName: string, latest: boolean = false, limit: number = 10) {
  const adventureIdRes = await axios.get(`/api/adventure/id?name=${adventureName}`)
  if (adventureIdRes.data.id) {
    return axios.get<Adventure[]>(`/api/adventure/${adventureIdRes.data.id}/logs?limit=${limit}&latest=${latest}`)
  }
}

export async function search(adventureName: string, key: string) {
  return axios.get<Log[]>(`/api/search?noContent=true&name=${adventureName}&key=${key}`)
} 