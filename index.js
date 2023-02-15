const {jsPDF} = require("jspdf");

class ReportBooklet {

    static getHolidays(year) {
        let getEasterDate = function (year) {
            let a = year % 19;
            let b = Math.floor(year / 100);
            let c = year % 100;
            let d = Math.floor(b / 4);
            let e = b % 4;
            let f = Math.floor((b + 8) / 25);
            let g = Math.floor((b - f + 1) / 3);
            let h = (19 * a + b - d - g + 15) % 30;
            let i = Math.floor(c / 4);
            let k = c % 4;
            let l = (32 + 2 * e + 2 * i - h - k) % 7;
            let m = Math.floor((a + 11 * h + 22 * l) / 451);
            let month = Math.floor((h + l - 7 * m + 114) / 31);
            let day = ((h + l - 7 * m + 114) % 31) + 1;
            return new Date(year, month - 1, day);
        };

        return [
            new Date(year, 0, 1),  // Neujahr
            new Date(year, 0, 6),  // Heilige Drei Könige
            getEasterDate(year),    // Ostern
            new Date(year, 4, 1),   // Tag der Arbeit
            new Date(year, 4, 16),  // Christi Himmelfahrt
            new Date(year, 4, 31),  // Fronleichnam
            new Date(year, 6, 15),  // Mariä Himmelfahrt
            new Date(year, 9, 3),   // Tag der deutschen Einheit
            new Date(year, 9, 31),  // Reformationstag
            new Date(year, 11, 24), // Heiligabend
            new Date(year, 11, 25), // 1. Weihnachtstag
            new Date(year, 11, 26)  // 2. Weihnachtstag
        ];
    }

    static main() {
        let start = new Date("2020-09-01");
        let end = new Date("2023-02-01");

        let school = [
            new Date("2022-06-27"),
            new Date("2022-06-28"),
            new Date("2022-06-29"),
            new Date("2022-06-30"),
            new Date("2022-07-01"),

            new Date("2022-07-18"),
            new Date("2022-07-19"),
            new Date("2022-07-20"),
            new Date("2022-07-21"),
            new Date("2022-07-22"),

            new Date("2022-07-25"),
            new Date("2022-07-26"),
            new Date("2022-07-27"),
            new Date("2022-07-28"),
            new Date("2022-07-29"),

            new Date("2022-10-03"),
            new Date("2022-10-04"),
            new Date("2022-10-05"),
            new Date("2022-10-06"),
            new Date("2022-10-07"),
        ];
        let sick = [
            new Date("2022-10-10"),
            new Date("2022-11-07"),
            new Date("2022-12-14"),
            new Date("2022-12-20"),


            new Date("2022-07-26"),
            new Date("2022-07-21"),
            new Date("2022-05-12"),
            new Date("2022-03-21"),
            new Date("2022-03-22"),
            new Date("2022-03-23"),
            new Date("2022-02-03"),
            new Date("2022-01-26"),
            new Date("2021-11-22"),

            new Date("2021-07-12"),
            new Date("2021-05-18"),
            new Date("2021-05-11"),
            new Date("2021-05-11"),
        ];

        let entries = ReportBooklet.generateBookletEntries(start, end, sick, school);
        ReportBooklet.buildPdfBook(entries);
    }

    static generateBookletEntries(startDate, endDate, sickDays, schoolDays) {

        let weekEntries = {};
        dayLoop:
            for (let day = startDate.getTime(); day < endDate.getTime(); day += 1000 * 60 * 60 * 24) {
                const date = new Date(day);

                for (let holiday of this.getHolidays(date.getFullYear())) {
                    if (this.dateMatch(holiday, date)) {
                        continue dayLoop;
                    }
                }

                for (let sick of sickDays) {
                    if (this.dateMatch(sick, date)) {
                        continue dayLoop;
                    }
                }

                //skip weekend and holidays
                if (date.getDay() === 0 || date.getDay() === 6) {
                    continue;
                }

                if (weekEntries[date.getFullYear()] === undefined) {
                    weekEntries[date.getFullYear()] = {};
                }

                let kw = ReportBooklet.getWeekNumber(date)
                if (weekEntries[date.getFullYear()][kw] === undefined) {
                    weekEntries[date.getFullYear()][kw] = {};
                }

                let humanDay = date.getDay() - 1;
                if (weekEntries[date.getFullYear()][kw][humanDay] === undefined) {
                    weekEntries[date.getFullYear()][kw][humanDay] = {
                        title: `Betriebliche Tätigkeiten am ${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`,
                        entries: ReportBooklet.generateEntry(date),
                    }
                }

                for (let schoolDay of schoolDays) {
                    if (ReportBooklet.dateMatch(schoolDay, date)) {

                        weekEntries[date.getFullYear()][kw][humanDay] = {
                            title: `Berufschul Themen in der Woche: ${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`,
                            entries: ReportBooklet.generateSchoolEntry(date),
                        }

                        continue dayLoop;
                    }
                }

            }

        return weekEntries;

    }

    static generateEntry(date) {
        let random = Math.floor(Math.random() * (3 - 1) + 2);
        let entries = [];

        let activities = require('./activities.json');

        let randoms = [];

        for (let i = 0; i < random; i++) {
            let rndm = Math.floor(Math.random() * (activities.length));

            while (randoms.includes(rndm)) {
                rndm = Math.floor(Math.random() * (activities.length));
            }

            randoms.push(rndm)
            entries.push(activities[rndm])
        }

        return entries;
    }

    static generateSickEntry(date) {
        return ['Krank'];
    }

    static generateHolidayEntry(date) {
        return ['Urlaub'];
    }

    static generateSchoolEntry(date) {
        let school = require('./school.json');

        let dateStr = date.toISOString().substring(0, 10);
        if (school[dateStr]) {
            return Object.entries(school[dateStr]).map(([key, value]) => `${key}: ${value}`);
        }

        return [];
    }

    static getWeekNumber(d) {
        d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        return [d.getUTCFullYear(), weekNo];
    }

    static dateMatch(first, second) {
        let requirements = [first.getDate() === second.getDate(), first.getMonth() === second.getMonth(), first.getFullYear() === second.getFullYear(),];

        for (let requirement of requirements) {
            if (!requirement) {
                return false;
            }
        }
        return true;
    }

    static buildPdfBook(entries) {
        const doc = new jsPDF({});
        doc.setFontSize(18);
        doc.text("Berichtsheft - Elias Krapf\n", 10, 10);
        doc.text("Firma - NosGroup", 10, 20);
        doc.text("Fachinformatiker Anwendungsentwicklung", 10, 60);
        doc.text("Fehltage: 31", 10, 70);

        let kwValue = 1;
        for (let [year, kws] of Object.entries(entries)) {

            for (let value of Object.values(kws)) {
                doc.addPage();
                doc.setFontSize(14)
                doc.text(`Ausbildungswoche - ${kwValue}\n`, 10, 10);
                doc.setFontSize(10);
                doc.text(`Im Jahr ${year}\n\n`, 180, 9)

                doc.setFontSize(12)
                let textContent = ``;
                for (let day of Object.values(value)) {
                    textContent += `${day.title}\n\n`;
                    for (let entries of day.entries) {
                        textContent += `- ${entries}\n`;
                    }
                    textContent += '\n';
                }

                doc.text(doc.splitTextToSize(textContent, 180), 10, 30);
                kwValue++;
            }

        }

        doc.save(`./output/Berichtsheft.pdf`);
    }

}

(function () {
    ReportBooklet.main();
}());
