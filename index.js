const mqtt = require('mqtt');
let Service, Characteristic;

module.exports = (homebridge) => {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory("homebridge-mqtt-weather-sensor", "MQTTWeatherSensor", MQTTWeatherSensor);
};

class MQTTWeatherSensor {
  constructor(log, config) {
    this.log = log;
    this.name = config.name;
    this.host = config.host;
    this.port = config.port;
    this.username = config.username;
    this.password = config.password;
    this.topic = config.topic;
    this.debug = config.debug || false;
    this.globalValues = config.globalValues || {};

    this.client = mqtt.connect(`mqtt://${this.host}:${this.port}`, {
      username: this.username,
      password: this.password,
    });

    this.temperature = 0;
    this.humidity = 0;
    this.pressure = 0;
    this.batteryLevel = 0;

    this.informationService = new Service.AccessoryInformation()
      .setCharacteristic(Characteristic.Manufacturer, this.globalValues.manufacturer || "Default Manufacturer")
      .setCharacteristic(Characteristic.Model, this.globalValues.model || "Default Model")
      .setCharacteristic(Characteristic.SerialNumber, this.globalValues.serialNumber || "0000000000");

    this.temperatureService = new Service.TemperatureSensor(this.name);
    this.humidityService = new Service.HumiditySensor(this.name);
    this.batteryService = new Service.BatteryService(this.name);

    this.temperatureService.getCharacteristic(Characteristic.CurrentTemperature)
      .on('get', this.getTemperature.bind(this));

    this.humidityService.getCharacteristic(Characteristic.CurrentRelativeHumidity)
      .on('get', this.getHumidity.bind(this));
      
    this.batteryService.getCharacteristic(Characteristic.BatteryLevel)
      .on('get', this.getBatteryLevel.bind(this));

    this.client.on('connect', () => {
      this.log.info('Connected to MQTT server');
      this.client.subscribe(this.topic, (err) => {
        if (err) {
          this.log.error('Failed to subscribe:', err);
        } else {
          this.log.info(`Subscribed to topic: ${this.topic}`);
        }
      });
    });

    this.client.on('message', this.handleMessage.bind(this));
  }

  handleMessage(topic, message) {
    this.log.info(`Message received on ${topic}: ${message.toString()}`);
    try {
      const data = JSON.parse(message.toString());
      this.log.debug(`Parsed data: ${JSON.stringify(data)}`);

      this.temperature = data.temperature;
      this.humidity = data.humidity;
      this.pressure = data.pressure;
      this.batteryLevel = data.battery_level;

      this.temperatureService
        .getCharacteristic(Characteristic.CurrentTemperature)
        .updateValue(this.temperature);

      this.humidityService
        .getCharacteristic(Characteristic.CurrentRelativeHumidity)
        .updateValue(this.humidity);

      this.batteryService
        .getCharacteristic(Characteristic.BatteryLevel)
        .updateValue(this.batteryLevel);

    } catch (error) {
      this.log.error('Error parsing message:', error);
    }
  }

  getTemperature(callback) {
    callback(null, this.temperature);
  }

  getHumidity(callback) {
    callback(null, this.humidity);
  }

  getBatteryLevel(callback) {
    callback(null, this.batteryLevel);
  }

  getServices() {
    return [this.informationService, this.temperatureService, this.humidityService, this.batteryService];
  }
}
