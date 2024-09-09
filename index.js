const mqtt = require('mqtt');
const { Service, Characteristic } = require('homebridge');

let Accessory; // Initialize variable for Homebridge Accessory

module.exports = (homebridge) => {
  Accessory = homebridge.hap.Accessory;
  homebridge.registerAccessory('homebridge-mqtt-weather-sensor', 'MqttWeatherSensor', MqttWeatherSensor);
};

class MqttWeatherSensor {
  constructor(log, config) {
    this.log = log;
    this.config = config;
    this.topic = this.config.topic;
    
    // Create MQTT connection URL
    const mqttUrl = `mqtt://${this.config.username}:${this.config.password}@${this.config.host}:${this.config.port}`;
    
    // Connect to the MQTT server
    this.client = mqtt.connect(mqttUrl);
    
    this.client.on('connect', () => {
      this.client.subscribe(this.topic, (err) => {
        if (!err) {
          this.log(`Subscribed to MQTT topic: ${this.topic}`);
        } else {
          this.log.error('Failed to subscribe to topic:', err);
        }
      });
    });

    this.client.on('message', (topic, message) => {
      const data = JSON.parse(message.toString());
      this.updateValues(data);
    });

    // Create a new accessory for the weather sensor
    this.weatherSensor = new Accessory('MQTT Weather Sensor', Accessory.UUIDGen.generate('mqtt-weather-sensor'));
    
    // Setup service
    const service = this.weatherSensor.addService(Service.TemperatureSensor, 'Temperature Sensor');
    service.getCharacteristic(Characteristic.CurrentTemperature)
      .onGet(() => this.currentTemperature);

    this.humidityService = this.weatherSensor.addService(Service.HumiditySensor, 'Humidity Sensor');
    this.humidityService.getCharacteristic(Characteristic.CurrentRelativeHumidity)
      .onGet(() => this.currentHumidity);

    this.pressureService = this.weatherSensor.addService(Service.AirPressureSensor, 'Pressure Sensor');
    this.pressureService.getCharacteristic(Characteristic.CurrentPressure)
      .onGet(() => this.currentPressure);
    
    this.batteryService = this.weatherSensor.addService(Service.Battery, 'Battery Level');
    this.batteryService.getCharacteristic(Characteristic.BatteryLevel)
      .onGet(() => this.batteryLevel);
      
    this.weatherSensor.on('identify', (paired, callback) => {
      this.log('Identify requested!');
      callback();
    });
  }

  updateValues(data) {
    this.currentTemperature = data.temperature;
    this.currentHumidity = data.humidity;
    this.currentPressure = data.pressure;
    this.batteryLevel = data.battery_level;

    this.weatherSensor.getService(Service.TemperatureSensor).setCharacteristic(Characteristic.CurrentTemperature, this.currentTemperature);
    this.humidityService.setCharacteristic(Characteristic.CurrentRelativeHumidity, this.currentHumidity);
    this.pressureService.setCharacteristic(Characteristic.CurrentPressure, this.currentPressure);
    this.batteryService.setCharacteristic(Characteristic.BatteryLevel, this.batteryLevel);
    
    this.log(`Updated values: Temp=${this.currentTemperature}, Humidity=${this.currentHumidity}, Pressure=${this.currentPressure}, Battery=${this.batteryLevel}`);
  }

  getServices() {
    return [this.weatherSensor, this.humidityService, this.pressureService, this.batteryService];
  }
}
