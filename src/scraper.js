import puppeteer from 'puppeteer';

export class NerdearlaAgendaScraper {
    async scrapeNerdearlaAgenda() {
        const browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ]
        });

        try {
            const page = await browser.newPage();

            // Configurar user agent y viewport
            await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
            await page.setViewport({ width: 1280, height: 720 });

            // Navegación optimizada para Docker
            console.log('[scraper] Loading agenda...');
            await page.goto('https://nerdear.la/agenda/', {
                waitUntil: 'domcontentloaded',
                timeout: 30000
            });

            // Esperar a que se cargue el contenido dinámico con timeout más corto
            try {
                await page.waitForSelector('.agenda-full', { timeout: 10000 });
            } catch (selectorError) {
                // Intentar con otros selectores
                try {
                    await page.waitForSelector('[class*="agenda"]', { timeout: 10000 });
                } catch {
                    // Continuar sin selector específico
                }
            }

            // Scroll para cargar todo el contenido
            await page.evaluate(() => {
                return new Promise((resolve) => {
                    let totalHeight = 0;
                    const distance = 100;
                    const timer = setInterval(() => {
                        const scrollHeight = document.body.scrollHeight;
                        window.scrollBy(0, distance);
                        totalHeight += distance;
                        if (totalHeight >= scrollHeight) {
                            clearInterval(timer);
                            resolve();
                        }
                    }, 100);
                });
            });

            // Extraer datos de las charlas
            const talks = await page.evaluate(() => {
                // Buscar elementos específicos de charlas usando la estructura real que encontramos
                const talkElements = document.querySelectorAll('.bar.bar-small-card');
                const dayElements = document.querySelectorAll('.agendra-flex-dia');

                // Extraer información de días disponibles
                const dayInfo = Array.from(dayElements).map(dayEl => {
                    const text = dayEl.textContent || '';
                    const dayMatch = text.match(/(Lunes|Martes|Miércoles|Jueves|Viernes|Sábado|Domingo)\s+(\d{1,2})/);
                    return dayMatch ? {
                        dayName: dayMatch[1],
                        dayNumber: parseInt(dayMatch[2]),
                        element: dayEl
                    } : null;
                }).filter(Boolean);

                return Array.from(talkElements).map((element, index) => {
                    const textContent = element.textContent || '';

                    // Buscar enlaces dentro del elemento
                    const linkElement = element.querySelector('a[href]');
                    let url = '';
                    if (linkElement) {
                        const href = linkElement.getAttribute('href');
                        // Si es un enlace relativo, convertirlo a absoluto
                        if (href) {
                            if (href.startsWith('http')) {
                                url = href;
                            } else if (href.startsWith('/')) {
                                url = `https://nerdear.la${href}`;
                            } else if (href.startsWith('#') || href === '') {
                                url = ''; // Enlaces internos o vacíos
                            } else {
                                url = `https://nerdear.la/${href}`;
                            }
                        }
                    }

                    // Extraer tag (primera palabra en mayúsculas)
                    const tagMatch = textContent.match(/^([A-Z\s]+)\s/);
                    const tag = tagMatch ? tagMatch[1].trim() : '';

                    // Extraer título (después del tag, antes del horario)
                    const titleMatch = textContent.match(/^[A-Z\s]+\s(.+?)\n\s*(\d{1,2}:\d{2})/s);
                    const title = titleMatch ? titleMatch[1].trim() : textContent.substring(0, 100);

                    // Extraer horario completo (inicio - fin)
                    const timeMatch = textContent.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
                    const startTime = timeMatch ? timeMatch[1] : '';
                    const endTime = timeMatch ? timeMatch[2] : '';

                    // Extraer speakers (líneas después del horario)
                    const speakerLines = textContent.split('\n').filter(line => {
                        const trimmed = line.trim();
                        return trimmed.length > 0 &&
                            !trimmed.match(/^\d{1,2}:\d{2}/) &&
                            !trimmed.match(/^[A-Z\s]+$/) &&
                            trimmed !== title.trim();
                    });

                    // Determinar día basado en posición en DOM
                    let dayInfo = 'Martes 23'; // Default
                    const dayContainer = element.closest('.agendra-flex-dia');
                    if (dayContainer) {
                        const dayText = dayContainer.textContent || '';
                        const dayMatch = dayText.match(/(Lunes|Martes|Miércoles|Jueves|Viernes|Sábado|Domingo)\s+(\d{1,2})/);
                        if (dayMatch) {
                            dayInfo = `${dayMatch[1]} ${dayMatch[2]}`;
                        }
                    }

                    return {
                        id: `talk-${index}`,
                        title: title,
                        speakers: speakerLines.slice(0, 3), // Máximo 3 speakers
                        timeText: startTime,
                        endTime: endTime,
                        tags: tag ? [tag] : [],
                        day: dayInfo,
                        description: '',
                        url: url, // URL de la charla si está disponible
                        rawContent: textContent.substring(0, 200) + '...'
                    };
                }).filter(talk => talk.title && talk.timeText);
            });

            return talks;
        } finally {
            await browser.close();
        }
    }
}
