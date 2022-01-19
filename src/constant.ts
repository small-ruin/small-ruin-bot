export const WITHDRAWAL_OPEN_ALERT = 
`防撤回功能已打开
    我宣布：所有撤回无效。`
export const WITHDRAWAL_CLOSE_ALERT = 
`防撤回功能已关闭
    尽归尘土...`
export const HELP_SUFFIX=`小废墟机器人v0.2.0 `
export const HELP_WITHDRAWAL =
`防撤回功能
Usage:
  @<bot> on - 打开防撤回功能
  @<bot> off - 关闭防撤回功能
  @<bot> status - 查看机器人状态
  @<bot> help - 帮助
  sm help 跑团log相关
  sd help 掷骰相关
`
export const HELP_SM=
`
sm 指 small-ruin，小废墟
Usage:
sm list 战役列表
sm list <adventure name> [options] 目标战役的log列表
sm search <adventure name> [log name] <keyword> [options] 搜索带有关键词的log
Options:
-u, --url 显示战役或者log的url
-l, --limit 显示log的熟练，默认10条，对战役无效
-e, --latest 显示最新的log，对战役无效
`
export const HELP_DICE=
`掷骰功能
sd 指 small-ruin dice

Usage:
sd [option] [掷骰表达式] [任何说明] [-t <次数>]
掷骰。掷骰表达式会计算结果，说明则简单地打印出来
sd [command] 见下

掷骰表达式：
[掷骰数]d<骰子面数>[+<加值>/-<减值>]
例：d8+2 2d8-3

command:
save -n <template name> [掷骰表达式] [任何说明]: 储存模版
exec -n <template name> [-t <次数>]: 执行模版
delete -n <template name>: 删除模版
clear: 删除所有模版
list: 列出模版
expect <掷骰表达式> [-t <次数>]: 测试期望，默认1000次
ma --bab <bab> --ab <ab> [-d/--damage <damage>] [-t <次数>]: 多打

example:
sd d20+5 巨剑挥砍 d12+7 伤害
sd save -n 攻击1 d20+5 巨剑挥砍 d12+7 伤害
sd exec -n 攻击1
sd delete -n 攻击1
sd expect d20+1 -t 10000
sd ma --bab 11 --ab 20 --damage d8+3
`

export const HELP_SB=
`战斗辅助功能
Usage:
sb <common>
common:
current: 群聊专用，将当前群设置为触发战斗的群
jump: 自动跳过
jump-time | t: 自动跳过时长，默认5分钟
jump-off | J: 关闭自动跳过
reminder: 自动提醒
reminder-off | R: 关闭自动提醒
at: 每回合自动@pc
at-off | af: 关闭自动@
on: 开始战斗计时, options如下
  -j/-J 打开/关闭自动跳过
  -t <time> 自动跳过时长，默认5分钟
  -r/-R 打开关闭自动提醒
  -a/-A 打开关闭自动@
pause: 暂停计时器
end： 结束战斗。注意：这会重置battle轮数，并删除全部的敌人
member: 管理参与者，后接：
  add <name> [-h hp] [-i 先攻]  [-t 临时生命] [-e 是否怪物] [-q qq昵称]: 添加参与者
  set <name> [-h hp] [-i 先攻]  [-t 临时生命] [-e 是否怪物] [-q qq昵称]: 修改参与者
  delete <name>: 删除参与者
  condition <name> [-c 状态 -r 轮数]: 设置状态
  damage <name> <damage>: 记录伤害
  nd <name> <damage>: 记录非致命伤害
  heal <name> <hp>: 恢复血量
  list [-a]: 查看人员
  delay <name1> <name2>: name1 延迟至 name2 后
nextRound: 下一轮
next: 下一个
reset: 重置战斗删除所有敌方单位
init: 先攻，后接：
  list [-a] 先攻表
  set <name> <init> 设置先攻
  switch <name1> <name2> 交换两个先攻相同的人的顺序
black: 黑名单，后接：
  add <name> 增加黑名单
  remove <name> 提出黑名单
  rm remove的别名
  list 列出黑名单
  clear 清空黑名单
rule <关键词> 搜索法术，暂时挂在这里，不过我比较懒可能就不动了
`
  