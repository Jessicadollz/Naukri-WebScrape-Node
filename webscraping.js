const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const xlsx = require('xlsx');
const fs = require('fs');

(async () => {
    // Launch the browser in non-headless mode to debug
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    // Go to the job board URL with waitUntil option
    await page.goto('https://www.naukri.com/it-jobs?src=gnbjobs_homepage_srch', { waitUntil: 'networkidle0' });

    // Wait for the broader selector to load
    await page.waitForSelector('#listContainer', { timeout: 60000 });

    // Scroll to ensure all content is loaded
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));

    // Get page content
    const content = await page.content();

    // Save the entire page content to a text file
    fs.writeFileSync('naukri_page_content.txt', content);

    // Load content into Cheerio
    const $ = cheerio.load(content);

    // Array to hold job data
    const jobs = [];

    // Scrape the data
    $('#listContainer > div.styles_job-listing-container__OCfZC > div > div').each((i, el) => {
        const jobTitle = $(el).find('div.row1 > a').text().trim();
        const companyName = $(el).find('div.row2 > span > a.comp-name.mw-25').text().trim();
        const location = $(el).find('div.row3 > div > span.loc-wrap.ver-line > span > span').text().trim();
        const postedDate = $(el).find('div.row6 > span.job-post-day').text().trim();
        const jobDescription = $(el).find('div.row4 > span').text().trim();

        let jobType = '';
        if (jobTitle && companyName && location && postedDate && jobDescription) {
            jobType = $(el).find('div.styles_left-section-container__btAcB > section.styles_job-desc-container__txpYf > div:nth-child(3) > div.styles_other-details__oEN4O > div:nth-child(4) > span > span').text().trim() || 'Full Time';
        }

        // Push the data to jobs array
        jobs.push({
            'Job Title': jobTitle,
            'Company Name': companyName,
            'Location': location,
            'Job Type': jobType,
            'Posted Date': postedDate,
            'Job Description': jobDescription
        });
    });

    // Save the data to an Excel file
    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(jobs);
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Tech Jobs');
    xlsx.writeFile(workbook, 'Tech_Jobs.xlsx');

    // Close the browser
    await browser.close();
})();
