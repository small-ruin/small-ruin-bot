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
sd [command] [option] [掷骰表达式] [任何说明]
如果不使用 command 会简单地进行掷骰。掷骰表达式会得到一个随机数，说明则简单地打印出来

掷骰表达式：
[掷骰数]d<骰子面数>[+加值/-减值]
例：d8+2 2d8-3

command:
save -n <template name> [掷骰表达式] [任何说明]: 储存模版
exec -n <template name>: 执行模版
delete -n <template name>: 删除模版
clear: 删除所有模版
list: 列出模版
expect -d <骰子面数> -t <次数>: 测试期望
ma --bab <bab> --ab <ab> [-d/--damage <damage>]: 多打

example:
sd d20+5 巨剑挥砍 d12+7 伤害
sd save -n 攻击1 d20+5 巨剑挥砍 d12+7 伤害
sd exec -n 攻击1
sd delete -n 攻击1
sd expect -d 20 -t 10000
sd ma --bab 11 --ab 20 --damage d8+3
`
  