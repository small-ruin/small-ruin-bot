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
                const catchResult = /^(\d+)?d(\d+)\+?(\d+)?/.exec(c)
                if (catchResult) {
                    let time = 1
                    let rollResult = []
                    if (catchResult[1]) {
                        time = +catchResult[1]
                    }
                    for(;time>0;time--) {
                        rollResult.push(this.dice.roll(+catchResult[2]))
                    }
                    result += rollResult.length > 1
                        ? `\n${c}=(${rollResult.join('+')})`
                        : `\n${c}=${rollResult[0]}`
                    if (catchResult[3]) {
                        result += `+${catchResult[3]}=${rollResult.reduce((p, c) => p+c) + +catchResult[3]}`
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