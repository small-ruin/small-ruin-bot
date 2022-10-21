import App from 'xianyu-robot'
import SmallRuin from './plugins/smallRuin'
import DicePlugin from './plugins/dice'
import SearchPlugin from './plugins/search'
import LogPlugin from './plugins/log'

const app = new App()

app
.plugin(SmallRuin)
.plugin(DicePlugin)
.plugin(SearchPlugin)
.plugin(LogPlugin)
.start({
  wss: false, // 是否使用wss
  accessToken: "", // API的访问token
  host: '127.0.0.1', // 客户端地址
  port: 6700, // 客服端端口
  reconnection: true, // 是否连线错误时自动重连
  reconnectionAttempts: 10, // 连续连线失败的次数不超过这个值
  reconnectionDelay: 3000 // 重复连线的延迟时间, 单位: ms
}, false, true).then(
  () => {},
  e => console.error(e)
)