const getWeatherForecast = async (city, apiKey) => {
    const apiUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric&lang=he`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.cod !== "200") {
            throw new Error(data.message);
        }

        const currentWeather = data.list[0];
        const today = new Date().setHours(0, 0, 0, 0);
        const todayForecasts = data.list.filter(item => {
            const itemDate = new Date(item.dt * 1000).setHours(0, 0, 0, 0);
            return itemDate === today;
        });

        return {
            current: {
                temp: currentWeather.main.temp,
                feels_like: currentWeather.main.feels_like,
                description: currentWeather.weather[0].description,
                humidity: currentWeather.main.humidity,
                wind_speed: currentWeather.wind.speed
            },
            hourly: todayForecasts.map(forecast => ({
                time: new Date(forecast.dt * 1000).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
                temp: forecast.main.temp,
                feels_like: forecast.main.feels_like,
                description: forecast.weather[0].description,
                humidity: forecast.main.humidity,
                wind_speed: forecast.wind.speed
            }))
        };
    } catch (error) {
        console.error("שגיאה בקבלת נתוני מזג האוויר:", error);
        throw error;
    }
};

const handleWeatherRequest = async (message) => {
    const words = message.body.split(' ');
    const city = words[2] || 'לוד'; // ברירת מחדל לעיר 'לוד'

    try {
        const forecast = await getWeatherForecast(city, '10fc7e20c08a0ef7eb4667cfa02b8967');
        
        // קבלת התחזית הנוכחית והתחזית לעוד 9 שעות
        const currentTemp = forecast.current.temp;
        const currentFeelsLike = forecast.current.feels_like;

const closestToNineHours = forecast.hourly.reduce((prev, curr) => {
    const prevDiff = Math.abs(new Date(prev.time).getHours() - 9);
    const currDiff = Math.abs(new Date(curr.time).getHours() - 9);
    return currDiff < prevDiff ? curr : prev;
}, forecast.hourly[0]);

const tempInNineHours = closestToNineHours.temp || 'לא זמין';
const feelsLikeInNineHours = closestToNineHours.feels_like || 'לא זמין';

        await message.reply(`בוקר טוב ליפה בנשים🤤
הבוקר שלנו יתחיל עם ${currentTemp} מעלות 
אבל ירגיש כמו ${currentFeelsLike} מעלות🤪
כשתסיימי את העבודה בשמחה גדולה תצאי לבחוץ ויהיה ${tempInNineHours} מעלות 
אבל ויש אבל גדול זה ירגיש כמו ${feelsLikeInNineHours} מעלות🤠 
יאללה מאמי שלי מחכה כבר לראות אותך כל כך בואי לבית שלנו😍😍😍`);

        // תחזית מפורטת לשעות היום
        await message.reply(`תחזית לשעות היום:\n${forecast.hourly.map(f => `${f.time}: ${f.temp}°C, ${f.description}`).join('\n')}`);
    } catch (error) {
        await message.reply('שגיאה בקבלת נתוני מזג האוויר.');
    }
};

module.exports = { handleWeatherRequest };
