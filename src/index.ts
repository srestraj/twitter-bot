import dotenv from 'dotenv';
import puppeteer from "puppeteer";
import { format } from "date-fns";
import Twitter from 'twitter';

const cron = require('node-cron');
let a = 1;

dotenv.config()


const client = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY as string,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET as string,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY as string,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET as string
});


async function grabGithubData(): Promise<string> {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto(
    "https://github.com/users/srestraj/contributions?from=2022-01-01"
  );
  let contribs = await page.$$eval("[data-count]", (val) =>
    val.reduce((acc, val) => acc + +(val.getAttribute("data-count")!) , 0)
  );

  const currentYear = format(new Date(), "yyyy");
  await browser.close();
  return `${currentYear} Github Contributions: ${contribs} || Presented by a 🤖`;
}

async function main() {
  const ans = await grabGithubData();
  const params = {
    location: ans
  };
  
  await client.post("account/update_profile", params);
    console.log("🎉 Success! Updated Twitter bio/location");
}

// create a new tweet
const tweet = () => {

    const message = `Day ${a++} | ${new Date().toLocaleString()} \nFrom a 🤖✌`;

    const onFinish = (err: { message: any; }, reply: any) => {
        if (err) {
            console.log("Error: ", err.message);
        } else {
            console.log("Success", reply.id);
        }
    };

    client.post("statuses/update", { status: message }, onFinish);
};

// schedule the tweet & Github update

const job = cron.schedule("15 13 * * *", () => {
    main().catch(err=> console.log(err))
    tweet()
});

job.start();