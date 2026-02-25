import { StatsD } from 'hot-shots';

export const dogstatsd = new StatsD({
    host: 'localhost',
    port: 8125,
    prefix: 'streamlog.',
});
