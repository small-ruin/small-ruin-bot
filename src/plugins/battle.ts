import minimist from "minimist";
import { Battle } from "../battle";
import { BotPlugin, GroupMsg, PrivateMsg } from "xianyu-robot";
import { HELP_SB } from "../constant";
import { readFileSync } from "fs";
import { join } from "path"
import spells from '../rules/3r_spells.json'

type Command = 'on' | 'pause' | 'end' | 'member' | 'next'
    | 'nextRound' | 'switch' | 'reset' | 'init' | 'help' | 'jump' | 'jump-off'
    | 'reminder' | 'reminder-off' | 'J' | 'R' | 'jump-time' | 'jt' | 'current'
    | 'row' | 'at' | 'at-off' | 'A' | 'status' | 'status' | 'delete' | 'reboot'
    | 'rule'

export default class DicePlugin extends BotPlugin {
    active: boolean = false
    cache: Record<number, Battle> = {}
    timeoutFlag = null
    spells = spells

    print(e: GroupMsg | PrivateMsg, ms: string | string[] | undefined, parsedArgv?: any) {
        if (parsedArgv?.silent) return
        if (!ms) return
        if (Array.isArray(ms)) {
            const f = setInterval(() => {
                this.print(e, ms.shift(), parsedArgv)
                if (ms.length === 0)
                    clearInterval(f)
            }, 1000)
        } else {
            if ((<GroupMsg>e).group_id) {
                this.Bot.Api.sendGroupMsg((<GroupMsg>e).group_id, ms)
            } else {
                this.Bot.Api.sendPrivateMsg((<PrivateMsg>e).user_id, ms)
            }
        }
    }
    privatePrint(userId: number, ms: string | string[] | undefined, parsedArgv?: any) {
        if (parsedArgv?.silent) return
        if (!ms) return
        if (Array.isArray(ms)) {
            const f = setInterval(() => {
                this.privatePrint(userId, ms.shift(), parsedArgv)
                if (ms.length === 0)
                    clearInterval(f)
            }, 1000)
        } else {
            this.Bot.Api.sendPrivateMsg(userId, ms)
        }
    }
    groupPrint(groupId: number, ms: string | string[] | undefined, parsedArgv?: any) {
        if (parsedArgv?.silent) return
        if (!ms) return
        if (Array.isArray(ms)) {
            const f = setInterval(() => {
                this.groupPrint(groupId, ms.shift(), parsedArgv)
                if (ms.length === 0)
                    clearInterval(f)
            }, 1000)
        } else {
            this.Bot.Api.sendGroupMsg(groupId, ms)
        }
    }

    async parseArgv(argv: minimist.ParsedArgs, battle: Battle,) {
        let userId
        if (argv.q || argv.qq) {
            const input = argv.q || argv.qq
            const ml = await this.Bot.Api.getGroupMemberList(battle.groupId)
            userId = Number.isInteger(+input) ? input
                : ml.find(m => m.card.indexOf(input) !== -1 || m.nickname.indexOf(input) !== -1)?.user_id
            if (!userId) throw new Error('没找到pc:' + input)
        }
        const rst: Record<string, any> = {
            time: argv.jumpTime || argv.t,
            hp: argv.h || argv.hp,
            init: argv.i || argv.init,
            tempHp: argv.t || argv.tempHp,
            enemy: argv.e || argv.enemy,
            all: argv.a || argv.all,
            condition: argv.c || argv.condition,
            round: argv.r || argv.round,
            pc: userId || null,
            silent: argv.silent || argv.s
        }

        if (argv.jump || argv.j) rst.autoJump = true
        if (argv.jumpOff || argv.J) rst.autoJump = false

        if (argv.reminder || argv.r) rst.autoInfo = true
        if (argv.reminderOff || argv.R) rst.autoInfo = false

        if (argv.at || argv.a) rst.autoAt = true
        if (argv.atOff || argv.A) rst.autoAt = false

        return rst
    }

    async handleMember(m: GroupMsg | PrivateMsg, argv: minimist.ParsedArgs, battle: Battle) {
        const command = argv._[2]
        const name = argv._[3]
        const parsedArgv = await this.parseArgv(argv, battle) as any
        switch (command) {
            case 'add':
                parsedArgv.name = name
                battle.addMember(parsedArgv)
                this.privatePrint(battle.dm, '添加成功:' + name, parsedArgv)
                break;
            case 'set':
                battle.setMember(name, parsedArgv)
                this.privatePrint(battle.dm, '设置成功:' + battle.getMember(name).print(), parsedArgv)
                break
            case 'delete':
                battle.delete(name)
                this.privatePrint(battle.dm, '删除成功:\n' + battle.printMember(), parsedArgv)
                break
            case 'condition':
                battle.setCondition(name, parsedArgv.condition, parsedArgv.round)
                this.privatePrint(battle.dm, '设置成功:' + battle.getMember(name).print(), parsedArgv)
                break
            case 'damage': {
                const damage = +argv._[4]
                if (isNaN(damage)) throw new Error('错误的数值')
                const result = battle.damage(name, damage)
                this.privatePrint(battle.dm, '设置成功:' + battle.getMember(name).print(), parsedArgv)
                if (result) {
                    this.groupPrint(battle.groupId, result)
                }
                break
            }
            case 'heal':
                const healthHp = +argv._[4]
                if (isNaN(healthHp)) throw new Error('错误的数值')
                battle.health(name, healthHp)
                this.privatePrint(battle.dm, '设置成功:' + battle.getMember(name).print(), parsedArgv)
                break
            case 'nd': {
                const damage = +argv._[4]
                if (isNaN(damage)) throw new Error('错误的数值')
                const result = battle.nd(name, damage)
                this.privatePrint(battle.dm, '设置成功:' + battle.getMember(name).print(), parsedArgv)
                if (result) {
                    this.groupPrint(battle.groupId, result)
                }
                break
            }
            case 'list':
                this.print(m, battle.printMember(!!parsedArgv.all), parsedArgv)
                break
            case 'delay':
                battle.delay(name, argv._[4])
                this.groupPrint(battle.groupId, `${name}延迟至${argv._[4]}后`)
                break
            default:
                throw new Error('未知指令：' + argv._[1])
        }
    }
    async handleInit(m: GroupMsg | PrivateMsg, argv: minimist.ParsedArgs, battle: Battle) {
        const command = argv._[2]
        const name = argv._[3]
        const parsedArgv = await this.parseArgv(argv, battle) as any
        switch (command) {
            case 'list':
                this.print(m, battle.printInit(parsedArgv.all), parsedArgv)
                break;
            case 'set':
                const init = +argv._[4]
                if (isNaN(init)) throw new Error('错误的数值')
                battle.setInit(name, init)
                this.privatePrint(battle.dm, '设置成功', parsedArgv)
                break
            case 'switch':
                battle.switchMem(name, argv._[4])
                break
            default:
                throw new Error('未知指令：' + argv._[1])
        }
    }
    handleNext(battle: Battle) {
        battle.nextRound()
        this.groupPrint(battle.groupId, `-------- 跳至${battle.round+1}轮 --------`)
        this.handleNextOne(battle)
    }
    handleNextOne(battle: Battle) {
        const mems = battle.next()
        
        const rst = [`-------- 第${battle.round+1}轮，${mems.map(m => m.name).join('、')}的回合 --------`]
        if (battle.autoInfo && battle.current) {
            mems.forEach(m => {
                const {enemy, conditions, hp, name} = m
                if (!enemy || (conditions.length !== 0)) {
                    rst.push(`${name}: ${m.enemy ? '' : m.hp + 'hp '}${m.conditions.map(c => c.name).join('、')}`)
                }
            })
        }
        if (battle.autoAt && battle.current?.pc) {
            rst.push(this.Bot.CQCode.at(+battle.current.pc))
        }
        this.groupPrint(battle.groupId, rst)

        if (battle.autoJump) {
            this.resetTimer(battle)
        }
    }
    resetTimer(battle: Battle) {
        if (this.timeoutFlag) {
            clearInterval(this.timeoutFlag)
        }
        // @ts-ignore
        this.timeoutFlag = setInterval(() => {
            this.groupPrint(battle.groupId, `${battle.current?.name}${battle.time}分钟没有响应，自动跳过`)
            this.handleNextOne(battle)
        }, battle.time * 1000 * 60)
    }
    async battleOn(argv: minimist.ParsedArgs, battle: Battle) {
        this.active = true

        let config = await this.parseArgv(argv, battle)
        const { autoJump, autoInfo, autoAt, time } = config
        config = { autoJump, autoInfo, autoAt, time }
        Object.keys(config).forEach(k => (config[k] === undefined) && delete config[k])
        Object.assign(battle, config)

        if (!battle.current)
            this.groupPrint(battle.groupId, '======== 战斗开始 ========')

        this.handleNextOne(battle)
    }
    async parseCmd(e: GroupMsg | PrivateMsg, battle: Battle) {
        const { message } = e
        const argv = minimist(message.split(' '))
        const parsedArgv = this.parseArgv(argv, battle)
        console.log('argv', argv)
        switch(argv._[1] as Command) {
            case 'current':
                const groupId = (<GroupMsg>e).group_id
                if (!groupId) throw new Error('只能在群里使用')
                battle.groupId = groupId
                this.groupPrint((<GroupMsg>e).group_id, `已挂载${(await this.Bot.Api.getGroupInfo(groupId))?.group_name}`, parsedArgv)
                break;
            case 'on':
                this.battleOn(argv, battle)
                break;
            case 'pause':
                this.active = false
                if (this.timeoutFlag)
                    clearInterval(this.timeoutFlag)
                this.groupPrint(battle.groupId, '暂停记时', parsedArgv)
                break;
            case 'end':
                this.active = false
                if (this.timeoutFlag)
                    clearInterval(this.timeoutFlag)
                this.groupPrint(battle.groupId, '======== 战斗结束 ========')
                battle.reset()
                battle.deleteAllEnemy()
                break;
            case 'member':
                await this.handleMember(e, argv, battle)
                break;
            case 'init':
                await this.handleInit(e, argv, battle)
                break
            case 'nextRound':
                this.handleNext(battle)
                break;
            case 'next':
                this.handleNextOne(battle)
                break
            case 'reset':
                this.active = false
                if (this.timeoutFlag)
                    clearInterval(this.timeoutFlag)
                battle.reset();
                this.groupPrint(battle.groupId, '重置战斗', parsedArgv)
                break
            case 'jump':
                battle.autoJump = true;
                this.print(e, `${battle.time}分钟未响应则自动跳过`, parsedArgv)
                break
            case 'jump-off' || 'J':
                battle.autoJump = false;
                this.print(e, `关闭自动跳过功能`, parsedArgv)
                break
            case 'jump-time' || 'jt':
                if (isNaN(+argv._[2]))
                    throw new Error('错误的时间')
                battle.time = +argv._[2]
                this.print(e, `${battle.time}分钟未响应则自动跳过`, parsedArgv)
                break
            case 'reminder':
                battle.autoInfo = true;
                this.print(e, `每轮显示人物状态`, parsedArgv)
                break
            case 'reminder-off' || 'R':
                battle.autoInfo = false
                this.print(e, `不显示人物状态`, parsedArgv)
                break
            case 'at':
                battle.autoAt = true
                this.print(e, `每轮@PC`, parsedArgv)
                break
            case 'at-off' || 'A':
                battle.autoAt = false
                this.print(e, `不@PC`, parsedArgv)
                break
            case 'help':
                this.print(e, HELP_SB)
                break
            case 'status':
                this.print(e, battle.print())
                break;
            case 'delete':
                delete this.cache[battle.dm]
                this.print(e, '卸载战斗', parsedArgv)
                break;
            case 'reboot':
                this.active = false
                if (this.timeoutFlag)
                    clearInterval(this.timeoutFlag)
                battle.reboot()
                this.print(e, '初始化战斗', parsedArgv)
                break;
            case 'rule':
                const keyword = argv._[2]
                if (keyword.length <= 1) {
                    this.print(e, '关键词少于2个字，忽略')
                }
                if (keyword in this.spells) {
                    // @ts-ignore
                    this.print(e, this.spells[keyword])
                } else {
                    const maybe = Object.keys(this.spells)
                        .filter(i => i.indexOf(keyword) !== -1)
                    if (maybe.length) {
                        if (maybe.length === 1) {
                            // @ts-ignore
                            this.print(e, this.spells[maybe[0]])
                        } else {
                            this.print(e, '未找到, 是不是要找' + maybe.join('、'))
                        }
                    } else {
                        this.print(e, '未找到')
                    }
                }
                break;
            default:
                throw new Error('未知指令：' + argv._[1])
        }
    }
    handleRow(e: PrivateMsg | GroupMsg, battle: Battle) {
            const msgs = e.message.replace(/^sb\s+row\s+?\r?\n?/, '').split('\n').map(i => i.replace('\r', ''))
            const f: any = setInterval(async () => {
                try {
                    if (msgs.length) {
                        const message = msgs.shift()
                        if (!message) return clearInterval(f)
                        e.message = message
                        await this.parseCmd(e, battle)
                    } else {
                        clearInterval(f)
                    }
                } catch(err) {
                    this.print(e, err+'')
                }
            }, 1000)
    }
    init(): void | Promise<void> {
        this.Bot.Event.on('message.group', async e => {
            const {message, group_id, sender} = e
            try {
                let bt = this.cache[sender.user_id];
                if (!bt) bt = this.cache[sender.user_id] = new Battle(sender.user_id, group_id)
                if (message.match(/^sb/)) {
                    if (message.split(' ')[1] = 'row') {
                        await this.handleRow(e, bt)
                    } else {
                        await this.parseCmd(e, bt)
                    }
                } else if (message.match(/end/) && this.active) {
                    if (!bt.current?.pc || (bt.current.pc && e.user_id === +bt.current.pc)) {
                        this.handleNextOne(bt)
                    }
                }
    
                if (this.active && bt.autoJump) {
                    if (bt.current && bt.current.pc) {
                        if (e.user_id === +bt.current.pc) {
                            this.resetTimer(bt)
                        }
                    } else {
                        this.resetTimer(bt)
                    }
                }
            } catch(err) {
                this.print(e, err + '')
            }
        })

        this.Bot.Event.on('message.private', async e => {
            const {message, user_id, sender} = e
            try {
                let bt = this.cache[sender.user_id];
                if (!bt)
                    throw new Error('无挂载中的战斗')
                if (e.message.match(/^sb/)) {
                    if (message.split(' ')[1] = 'row') {
                        await this.handleRow(e, bt)
                    } else {
                        await this.parseCmd(e, bt)
                    }
                }
            } catch(err) {
                this.privatePrint(user_id, err + '')
            }
        })
    }
}