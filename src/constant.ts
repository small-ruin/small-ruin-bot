export const HELP_SUFFIX=`小废墟机器人v1.0.0 `
export const HELP_SM=
`
sm 指 small-ruin，小废墟
Usage:
sm list 战役列表
sm list <adventure name> [options] 目标战役的log列表
sm search <adventure name> [log name] <keyword> [options] 搜索带有关键词的log
Options:
-u, --url 显示战役或者log的url
-l, --limit 显示log的数量，默认10条，对战役无效
-e, --latest 显示最新的log，对战役无效
`
export const HELP_DICE=
`掷骰功能
sd 指 small-ruin dice

Usage:
s[掷骰表达式 | option] [任何说明] [-t <次数>]
掷骰。掷骰表达式会计算结果，说明则简单地打印出来
[command] 见下

掷骰表达式：
[掷骰数]d<骰子面数>[+<加值>/-<减值>]
例：d8+2 2d8-3
对应指令：sd8+2 s2d8-3

command:
sds, sd save -n <template name> [掷骰表达式] [任何说明]: 储存模版
sde, sd exec [-n] <template name> [-t <次数>]: 执行模版
sdd, sd delete [-n] <template name>: 删除模版
sdc, sd clear: 删除所有模版
sdl, sd list: 列出模版
sdexpect <掷骰表达式> [-t <次数>]: 测试期望，默认1000次
sdma --bab <bab> --ab <ab> [-d/--damage <damage>] [-t <次数>]: 多打

example:
sd20+5 巨剑挥砍 d12+7 伤害
sds -n 攻击1 d20+5 巨剑挥砍 d12+7 伤害
sde 攻击1
sdd 攻击1
sdexpect d20+1 -t 10000
sdma --bab 11 --ab 20 --damage d8+3
`

export const HELP_SS=
`
搜索功能
ss <关键词> 搜索法术，暂时挂在这里，不过我比较懒可能就不动了
`
  