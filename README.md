# Homebridge MQTT weather sensor ![Static Badge](https://img.shields.io/badge/npm-v9-blue:)

Homebridge MQTT weather sensor is a plugin that exposes temperature, humidity, battery level from sensors stored in an MQTT server.

The names of the fields in the MQTT server topic are:
temperature, humidity and battery_level

---

## Install

Install the plugin using:

```bash
npm i -g homebridge-mqtt-weather-sensor
```

## Configure

Add to the `accessories` field of your Homebridge `config.json` file (default location at `~/.homebridge/config.json`) :

```json
"accessory": "MQTTWeatherSensor",
"name": "Mqtt Weather Sensor",
"host": "YOUR_MQTT_SERVER", 
"port": 1883,
"username": "YOUR_USERNAME",
"password": "YOUR_PASSWORD",
"topic": "esp32_station",
"debug": true,
    "globalValues": {
        "manufacturer": "ESP32_Station",
        "serialNumber": "1234567890",
        "model": "Sensor"
    }
```