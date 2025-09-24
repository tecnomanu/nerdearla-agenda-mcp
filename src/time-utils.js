import moment from 'moment-timezone';

export class TimeUtils {
    static getCurrentTimeArgentina() {
        return moment().tz('America/Argentina/Buenos_Aires');
    }

    static parseTimeFromText(timeText, talkDay, currentDate) {
        if (!timeText) return null;

        // Buscar patrones de hora HH:MM
        const timeMatch = timeText.match(/(\d{1,2}):(\d{2})/);
        if (!timeMatch) return null;

        const [, hours, minutes] = timeMatch;

        // Determinar la fecha correcta basada en el día de la charla
        let talkDate = currentDate.clone();

        if (talkDay) {
            const dayMatch = talkDay.match(/(Lunes|Martes|Miércoles|Jueves|Viernes|Sábado|Domingo)\s+(\d{1,2})/);
            if (dayMatch) {
                const dayNumber = parseInt(dayMatch[2]);
                const currentDay = currentDate.date();

                // Si es un día diferente al actual, ajustar la fecha
                if (dayNumber !== currentDay) {
                    talkDate = currentDate.clone().date(dayNumber);

                    // Si el día es menor al actual, probablemente es del próximo mes
                    if (dayNumber < currentDay) {
                        talkDate = talkDate.add(1, 'month');
                    }
                }
            }
        }

        const talkTime = talkDate
            .hour(parseInt(hours))
            .minute(parseInt(minutes))
            .second(0);

        return talkTime;
    }
}
