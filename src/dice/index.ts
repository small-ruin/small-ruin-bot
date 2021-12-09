export default class Dice {
    roll(n: number) {
        return Math.round(Math.random() * (n -1) + 1)
    }
    expected(diceN: number = 20, times: number = 1000) {
        let sum = 0, i = 0
        for (i; i<times; i++) {
            const r = d.roll(diceN)
            sum += r
        }
        return `掷d${diceN}骰${times}次，期望：${(sum / times).toFixed(4)}`
    }
}


const d = new Dice
let sum = 0

for (var i = 0; i<20; i++) {
    const r = d.roll(20)
    sum += r
}

console.log('expect:', sum/(i+1))
