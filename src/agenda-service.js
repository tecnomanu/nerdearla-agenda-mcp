import { NerdearlaAgendaScraper } from './scraper.js';
import { TimeUtils } from './time-utils.js';

export class NerdearlaAgendaService {
    constructor() {
        this.scraper = new NerdearlaAgendaScraper();
        this.cache = null;
        this.cacheTime = null;
        this.CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas
        this.isInitializing = false;

        // Inicializar cache automáticamente al crear la instancia
        this.initializeCache();
    }

    /**
     * Inicializa el cache automáticamente al arrancar el servidor
     */
    async initializeCache() {
        if (this.isInitializing) return;
        this.isInitializing = true;

        try {
            console.log('[cache] 🚀 Initializing cache...');
            const startTime = Date.now();

            this.cache = await this.scraper.scrapeNerdearlaAgenda();
            this.cacheTime = Date.now();

            const scrapingTime = Date.now() - startTime;
            console.log(`[cache] ✅ Ready! ${this.cache.length} talks cached in ${scrapingTime}ms`);
        } catch (error) {
            console.error('[cache] ❌ Init failed:', error.message);
        } finally {
            this.isInitializing = false;
        }
    }

    async getCachedTalks() {
        // Si está inicializando, esperar a que termine
        if (this.isInitializing) {
            while (this.isInitializing) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        const now = Date.now();

        // Si no hay cache o está expirado, hacer scraping
        if (!this.cache || !this.cacheTime || (now - this.cacheTime) > this.CACHE_DURATION) {
            console.log('[cache] 🔄 Cache expired - refreshing...');

            try {
                const startTime = Date.now();
                this.cache = await this.scraper.scrapeNerdearlaAgenda();
                this.cacheTime = now;
                const scrapingTime = Date.now() - startTime;

                console.log(`[cache] ✅ Refreshed! ${this.cache.length} talks in ${scrapingTime}ms`);
            } catch (error) {
                console.error('[cache] ❌ Refresh failed:', error.message);
                // Si hay cache anterior, usarlo
                if (this.cache) {
                    const cacheAge = Math.floor((now - this.cacheTime) / 1000 / 60);
                    console.log(`[cache] 🔄 Using stale cache (${cacheAge}min old)`);
                    return this.cache;
                }
                throw error;
            }
        }

        return this.cache;
    }

    /**
     * Fuerza la actualización del cache (útil para testing o actualizaciones manuales)
     */
    async forceRefreshCache() {
        console.log('[cache] 🔄 Forcing refresh...');
        this.cache = null;
        this.cacheTime = null;
        return await this.getCachedTalks();
    }

    /**
     * Obtiene información del estado del cache
     */
    getCacheInfo() {
        if (this.isInitializing) {
            return {
                status: 'initializing',
                message: 'Cache is being initialized on server startup...',
                progress: 'Scraping Nerdearla agenda for the first time'
            };
        }

        if (!this.cache || !this.cacheTime) {
            return {
                status: 'empty',
                message: 'No cache available - will be created on first request'
            };
        }

        const now = Date.now();
        const cacheAge = now - this.cacheTime;
        const isExpired = cacheAge > this.CACHE_DURATION;
        const timeLeft = this.CACHE_DURATION - cacheAge;

        return {
            status: isExpired ? 'expired' : 'valid',
            talksCount: this.cache.length,
            ageMinutes: Math.floor(cacheAge / 1000 / 60),
            hoursLeft: isExpired ? 0 : Math.floor(timeLeft / 1000 / 60 / 60),
            validUntil: new Date(this.cacheTime + this.CACHE_DURATION).toLocaleString('es-AR', {
                timeZone: 'America/Argentina/Buenos_Aires'
            }),
            message: isExpired ? 'Cache expired, will refresh on next request' : 'Cache is valid and active'
        };
    }

    async getUpcomingTalks(limit = 5) {
        const talks = await this.getCachedTalks();
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
        const talks = await this.getCachedTalks();
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
        const talks = await this.getCachedTalks();

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
        const talks = await this.getCachedTalks();
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
        const talks = await this.getCachedTalks();
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
