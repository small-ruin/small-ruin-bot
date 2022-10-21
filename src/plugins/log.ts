import { BotPlugin, GroupMsg, PrivateMsg } from 'xianyu-robot';
import MessageManger from '../core/Message';
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

type Rows = string[]
type Command = 'start' | 'end'
interface CLog {
    rows: Rows,
    start: Date
}

export default class LogPlugin extends BotPlugin {
    name = 'log'
    mm: MessageManger = new MessageManger(this.Bot)

    switch: boolean = false
    userInput: string = ''
    isConfirming: boolean = false
    isInputingName: boolean =false
    store: Map<number | string, CLog> = new Map()

    parseCmd(e: GroupMsg) {
        let command = e.message.split(' ')[1] as Command
        switch(command) {
            case 'start':
                this.recordStart(e.group_id)
                break
            case 'end':
                this.recordEnd(e.group_id)
                break
        }
    }

    recordStart(id: number) {
        let cPkg = this.store.get(id)
        if (!cPkg) cPkg = this.resetCPkg(id)
        if (cPkg.rows.length > 0) {
            this.mm.groupPrint(id, '有尚未保存的数据，继续？y/n')
            this.isConfirming = true
        } else {
            this.mm.groupPrint(id, '开始记录')
            this.switch = true
        }
    }
    record(e: GroupMsg) {
        if (this.switch) {
            let {group_id: id, message} = e
            const cPkg = this.store.get(id)
            if (!cPkg) return this.mm.groupPrint(id, '出错了')

            if (/^\[CQ:image/.test(message)) {
                let regCatch = /url=([^\]^,]+)/.exec(message)
                if (regCatch) message = regCatch[1]
            }
            if (/^\[CQ:face/.test(message)) {
                message = '表情'
            }
            message = `<${e.sender.nickname}> ${message}`

            if (+new Date() - +cPkg?.start > 24 * 60 * 60 * 1000) {
                this.mm.groupPrint(id, '超过一天，不再进行记录。')
            } else {
                cPkg?.rows.push(message)
            }
        }
    }
    recordEnd(id: number) {
        this.switch = false
        this.mm.groupPrint(id, '记录结束，请输入文件名称:')
        this.isInputingName = true

    }
    resetCPkg(id: number) {
        const newCPkg = {
            start: new Date(),
            rows: []
        }
        this.store.set(id, newCPkg)
        return newCPkg
    }

    confirmed(id: number) {
        this.resetCPkg(id)
        this.recordStart(id)
    }

    async createFile(name: undefined | string, id:number) {
        const cPkg = this.store.get(id)
        if (cPkg) {
            try {
                await mkdir(join('./', 'logs'), { recursive: true })
                await writeFile(join('./logs/', '' + name + '-' + +new Date()), cPkg.rows.join('\n'))
                this.mm.groupPrint(id, name + '写入' + cPkg.rows.length + '行')
            } catch(e) {
                console.error(e)
            }

        }
    }

    init(): void | Promise<void> {
        this.Bot.Command
            .command('日志')
            .reg(/.+/)
            .action('group', e => {
                if (/^slog/.test(e.message))
                    return this.parseCmd(e)
                if (this.isConfirming) {
                    if (e.message === 'y') {
                        this.isConfirming = false
                        this.confirmed(e.group_id)
                    } else {
                        this.isConfirming = false
                    }
                    return
                } 
                if (this.isInputingName) {
                    this.createFile(e.message, e.group_id)
                    this.isInputingName = false
                }
                if (this.switch)
                    return this.record(e)
            })
            .action('private', e => {
                if (/^slog/.test(e.message))
                    this.mm.privatePrint(e.user_id, '此功能无法用于个人')
            })
    }
}