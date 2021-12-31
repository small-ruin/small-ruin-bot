type ConditionName = '目盲' | '被吹动' | '受阻' | '困惑' | '畏缩' | '晕眩' | '目眩' | '死亡'
  | '耳聋' | '瘫痪' | '濒死' | '能量吸取' | '纠缠' | '力竭'
  | '迷魂' | '疲乏' | '措手不及' | '惊惧' | '擒抱' | '虚体'
  | '隐形' | '吹倒' | '反胃' | '恐慌' | '麻痹' | '石化'
  | '压制' | '俯卧' | '战栗' | '恶心' | '稳定' | '恍惚'
  | '震慑' | '驱散' | '昏迷' | null
interface Condition {
  name: ConditionName,
  round?: number
}
interface MemberInit{
  name: string,
  hp: number,
  pc: string,
  tempHp: number,
  init: number | null,
  enemy: boolean,
}
export class Member {
  name: string
  pc?: string
  hp: number
  init: number | null = null
  tempHp: number = 0
  conditions: Condition[] = []
  enemy = false
  constructor({name, pc = '', hp = 0, tempHp = 0, init = null, enemy = false}: MemberInit) {
    this.name = name
    this.pc = pc
    this.hp = hp
    this.tempHp = tempHp
    this.init = init
    this.enemy = enemy
  }
  print() {
    return `${this.name}: hp-${this.hp} ${this.tempHp ? '临时生命-' + this.tempHp : ''} init-${this.init} 怪物-${this.enemy ? '是' : '否'}
状态：${this.conditions.map(c => c.name + '-' + (c.round ? c.round + '轮' : c.round )).join('、')}`
  }
  setCondition(condition:Condition) {
    const target = this.conditions.find(c => c.name === condition.name)
    if (target) {
      target.round = condition.round
    } else {
      this.conditions.push(condition)
    }
    this.clearCondition()
  }
  clearCondition() {
    this.conditions = this.conditions.filter(c => c.round !== 0)
  }
  setInit(i: number) {
    this.init = i
  }
  setAttrs({ hp, init, tempHp, enemy }: MemberInit) {
    this.hp = hp 
    this.init = init
    this.tempHp = tempHp
    this.enemy = enemy
  }
  damage(d: number) {
    if (!this.hp) {
      throw new Error(`${this.name}未设置HP！`)
    }
    if (this.tempHp > 0) {
      this.tempHp -= d
      if (this.tempHp < 0) {
        this.hp += this.tempHp
        this.tempHp = 0
      }
    } else {
      this.hp -= d
    }
  }
}

export class Battle {
  groupId: number
  dm: number
  members: Member[] = []
  round = 0
  current: null | Member = null
  time = 5
  autoJump = true
  autoInfo = true
  autoAt = true
  
  constructor(dm: number, groupId: number) {
    this.dm = dm
    this.groupId = groupId
  }

  addMember(m: any) {
    this.members.push(new Member(m))
    this.sort()
  }
  delete(name: string) {
    this.members.splice(this.getMemberIdx(name), 1)
  }
  reboot() {
    this.reset()
    this.members = []
    this.autoJump = true
    this.autoInfo = true
    this.autoAt = true
  }
  setInit(name: string, init: number) {
    this.getMember(name)?.setInit(init)
  }
  setMember(name: string, attrs: MemberInit) {
    this.getMember(name)?.setAttrs(attrs)
  }
  setCondition(name: string, c: ConditionName, round: number) {
    const condition: Condition = { name: c }
    if (round) condition.round = round
    this.getMember(name)?.setCondition(condition)
  }
  reset() {
    this.members = this.members.filter(m => !m.enemy)
    this.round = 0
    this.current = null
  }
  delay(name: string, target: string) {
    const actionM = this.members.find(m => m.name === name)
    const targetIndex = this.members.findIndex(m => m.name === target)
    const targetM = this.members[targetIndex]
    const nextM = this.members[targetIndex + 1]
    if (!actionM) throw new Error('未找到实施者:' + name)
    if (targetIndex === -1) throw new Error('未找到目标:' + name)
    if (actionM.init === null || targetM.init === null)
      throw new Error('未设置先攻')
    if (!nextM) {
      actionM.init = targetM.init - 1
      return
    }
    if (nextM.init === null) throw new Error(nextM.name + '未设置先攻')
    actionM.init = (targetM.init + nextM.init) / 2
    this.sort()
  }
  getMember(name: string) {
    const m = this.members.find(m => m.name === name)
    if (!m) throw new Error('未找到PC')
    return m
  }
  getMemberIdx(name: string) {
    const i = this.members.findIndex(m => m.name === name)
    if (i === -1) throw new Error('未找到PC')
    return i
  }
  isLastMember(name: string) {
    return this.getMemberIdx(name) === this.members.length - 1
  }
  sort() {
    this.members = this.members
      .filter(m => m.init !== null)  
      // @ts-ignore
      .sort((a, b) => b.init - a.init)
  }
  switchMem(name1: string, name2: string) {
    if (this.getMember(name1)?.init !== this.getMember(name2)?.init) {
      throw Error('先攻不同不能交换')
    }
    const member1 = this.getMember(name1)
    const member2 = this.getMember(name2)
    const member1I = this.getMemberIdx(name1)
    const member2I = this.getMemberIdx(name2)
    this.members[member1I] = member2
    this.members[member2I] = member1
  }
  next() {
    if (this.members.every(m => m.enemy))
      throw new Error('没有PC！')

    let current = (this.current === null || this.current === undefined) ? null : this.getMemberIdx(this.current.name)
    let next = (current !== null) ? current : -1
    let result: Member[] = []

    if (!this.members[next+1] && this.current) {
      this.nextRound()
      next = -1
    }

    if (this.members[next + 1].enemy) {
      while(this.members[next + 1]?.enemy) {
        next++
        result.push(this.members[next])
        this.current = this.members[next]
      }
    } else {
      next = next+1
      this.current = this.members[next]
      result.push(this.current)
    }

    return result
  }
  nextRound() {
    this.round++
    this.current = this.members[0]
    this.members.forEach(m => {
      m.conditions.forEach((c, i) => {
        if (c.round) {
          c.round--
        }
      })
      m.clearCondition()
    })
  }
  damage(name: string, damage: number) {
    this.getMember(name)?.damage(damage)
  }
  print() {
    return `挂载群: ${this.groupId}
自动跳过: ${this.autoJump}
自动跳过时长: ${this.time}
自动提示PC状态: ${this.autoInfo}
自动@PC: ${this.autoAt}
轮数: ${this.round+1}
当前玩家: ${this.current?.name}`
  }
  printMember() {
    return this.members.map(m => m.print()).join('\n')
  }
  printInit(a: boolean) {
    let list = this.members.slice()
    if (!a) list = list.filter(m => !m.enemy) 
    return list.map(m => m.name + ':' + m.init).join('\n')
  }
}