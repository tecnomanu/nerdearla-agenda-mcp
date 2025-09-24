import { NerdearlaAgendaScraper } from './scraper.js';
import { TimeUtils } from './time-utils.js';

export class NerdearlaAgendaService {
    constructor() {
        this.scraper = new NerdearlaAgendaScraper();
    }

    async getUpcomingTalks(limit = 5) {
        const talks = await this.scraper.scrapeNerdearlaAgenda();
        const currentTime = TimeUtils.getCurrentTimeArgentina();

        const upcomingTalks = talks
            .map(talk => ({
                ...talk,
                parsedTime: TimeUtils.parseTimeFromText(talk.timeText, talk.day, currentTime)
            }))
            .filter(talk => talk.parsedTime && talk.parsedTime.isAfter(currentTime))
            .sort((a, b) => a.parsedTime.diff(b.parsedTime))
            .slice(0, limit);

        return {
            currentTime: currentTime.format(),
            upcomingTalks: upcomingTalks.map(talk => ({
                ...talk,
                parsedTime: talk.parsedTime.format(),
                timeUntil: talk.parsedTime.from(currentTime)
            })),
            total: upcomingTalks.length
        };
    }

    async getPastTalks(limit = 5) {
        const talks = await this.scraper.scrapeNerdearlaAgenda();
        const currentTime = TimeUtils.getCurrentTimeArgentina();

        const pastTalks = talks
            .map(talk => ({
                ...talk,
                parsedTime: TimeUtils.parseTimeFromText(talk.timeText, talk.day, currentTime)
            }))
            .filter(talk => talk.parsedTime && talk.parsedTime.isBefore(currentTime))
            .sort((a, b) => b.parsedTime.diff(a.parsedTime))
            .slice(0, limit);

        return {
            currentTime: currentTime.format(),
            pastTalks: pastTalks.map(talk => ({
                ...talk,
                parsedTime: talk.parsedTime.format(),
                timeAgo: talk.parsedTime.from(currentTime)
            })),
            total: pastTalks.length
        };
    }

    async getTopicsByTags() {
        const talks = await this.scraper.scrapeNerdearlaAgenda();

        const topicsByTags = {};
        talks.forEach(talk => {
            if (talk.tags && talk.tags.length > 0) {
                talk.tags.forEach(tag => {
                    if (!topicsByTags[tag]) {
                        topicsByTags[tag] = [];
                    }
                    topicsByTags[tag].push({
                        title: talk.title,
                        speakers: talk.speakers,
                        timeText: talk.timeText
                    });
                });
            } else {
                // Sin tags específicos
                if (!topicsByTags['Sin categoría']) {
                    topicsByTags['Sin categoría'] = [];
                }
                topicsByTags['Sin categoría'].push({
                    title: talk.title,
                    speakers: talk.speakers,
                    timeText: talk.timeText
                });
            }
        });

        return {
            topicsByTags,
            totalTags: Object.keys(topicsByTags).length,
            totalTalks: talks.length
        };
    }

    async getNextTalk() {
        const talks = await this.scraper.scrapeNerdearlaAgenda();
        const currentTime = TimeUtils.getCurrentTimeArgentina();

        const nextTalk = talks
            .map(talk => ({
                ...talk,
                parsedTime: TimeUtils.parseTimeFromText(talk.timeText, talk.day, currentTime)
            }))
            .filter(talk => talk.parsedTime && talk.parsedTime.isAfter(currentTime))
            .sort((a, b) => a.parsedTime.diff(b.parsedTime))[0];

        return {
            currentTime: currentTime.format(),
            nextTalk: nextTalk ? {
                ...nextTalk,
                parsedTime: nextTalk.parsedTime.format(),
                timeUntil: nextTalk.parsedTime.from(currentTime)
            } : null
        };
    }

    async getMissedTalks() {
        const talks = await this.scraper.scrapeNerdearlaAgenda();
        const currentTime = TimeUtils.getCurrentTimeArgentina();

        // Charlas que empezaron hace menos de 2 horas (asumiendo duración promedio)
        const missedTalks = talks
            .map(talk => ({
                ...talk,
                parsedTime: TimeUtils.parseTimeFromText(talk.timeText, talk.day, currentTime)
            }))
            .filter(talk => {
                if (!talk.parsedTime) return false;
                const timeDiff = currentTime.diff(talk.parsedTime, 'minutes');
                return timeDiff > 0 && timeDiff <= 120; // Empezó hace menos de 2 horas
            })
            .sort((a, b) => b.parsedTime.diff(a.parsedTime));

        return {
            currentTime: currentTime.format(),
            missedTalks: missedTalks.map(talk => ({
                ...talk,
                parsedTime: talk.parsedTime.format(),
                startedAgo: talk.parsedTime.from(currentTime)
            })),
            total: missedTalks.length
        };
    }
}
