import Dice from ".";

export default class Speaker {
    dice = new Dice()
    userId;
    template: { [key: string]: string[]}

    constructor(userId: number) {
        this.userId = userId
        this.template = {}
    }

    exec(commander: string[], times: number = 1) {
        let result = '掷骰：'

        while(times) {
            commander.forEach(c => {
                if (/^\d*d[\+\-\dd]+/.exec(c)) {
                    let express = c
                    express = express.replace(/\d*d\d+/g, (subs) => {
                        let [self, time = 1, diceN] = /^(\d*)d(\d+)/.exec(subs) as RegExpExecArray
                        time = +time
                        let result = ''
                        if (time > 1) {
                            result += '('
                            while (time > 0) {
                                result += this.dice.roll(+diceN)
                                // 不是最后一次roll点
                                if (time !== 1) {
                                    result += '+'
                                }

                                time--
                            }
                            result += ')'
                        } else {
                            result += this.dice.roll(+diceN)
                        }
                        return result
                    })

                    console.log('express:', express)

                    // 单个骰子且无加值
                    if (/^d\d+$/.exec(c)) {
                        result += `\n${c}=${express}`
                    } else {
                        result += `\n${c}=${express}=${eval(express)}`
                    }

                } else {
                    result += ' ' + c
                }
            })

            times--
        }

        return result
    }

    multipleAttack(bab: number, ab: number, damage?: string, times?: number) {
        let result = ''
        let time = 1
        const execArgs = []
        if (!bab || +bab === NaN) {
            throw new Error('使用 --bab 指定bab')
        }
        if (!ab || +ab === NaN) {
            throw new Error('使用 --ab 指定ab')
        }
        while (bab > 0) {
            execArgs.push(`d20+${ab}`)
            execArgs.push('第'+time+'次')
            if (damage) {
                execArgs.push(damage)
                execArgs.push('如果命中')
                if (bab-5 > 0) {
                    execArgs.push('\n--------')
                }
            }
            bab -= 5
            ab -= 5
            time+=1
        }
        return result+this.exec(execArgs, times)
    }

    expected(diceN: number, times: number = 1000) {
        return this.dice.expected(diceN, times)
    }

    saveTemplate(name: string, template: string[]) {
        this.template[name] = template
    }

    listTemplate() {
        return Object.keys(this.template).map(k => `${k}：${this.template[k].join(' ')}`).join('\n')
    }

    getTemplate(name: string) {
        return this.template[name]
    }

    deleteTemplate(name: string) {
        delete this.template[name]
    }

    clearTemplate() {
        this.template = {}
    }

    execTemplate(name: string, times?: number) {
        if (name in this.template) {
            return this.exec(this.template[name], times)
        } else {
            throw new Error(`不存在名为${name}的模版`)
        }
    }
}