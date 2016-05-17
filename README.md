# Project Pi-WakeUp

## Setting
`config.json` sample :
```
{
  "db": {
    "name": "DB-NAME"
  },
  "server": {
    "port": "SERVER-PORT",
    "ip": "SERVER-IP"
  }
}
```

## To start
Need node.js and mongoDB and then :

```
git clone https://github.com/Cr4zySheep/Pi-WakeUp.git
cd Pi-WakeUp
node install
node app.js
```

## Advice
When using multiple device, be aware that they can have different time and that's why alarms could ring several times.
