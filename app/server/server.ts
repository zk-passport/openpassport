import express, {Request, Response} from 'express';
import bodyParser from 'body-parser';
import fs from 'fs';

const app = express();

// parse application/json
app.use(bodyParser.json());

app.post('/post', (req: Request, res: Response) => {
  const data = req.body;
  fs.writeFile('passportData.json', JSON.stringify(data, null, 2), err => {
    if (err) {
      console.log("err posting new passportData", err);
      res.status(500).json({message: 'An error occurred while writing file'});
    } else {
      console.log("File written successfully");
      res.json({message: 'File written successfully'});
    }
  });
});

app.get('/passportData', (req: Request, res: Response) => {
  fs.readFile('passportData.json', (err, data) => {
    if (err) {
      console.log("err fetching passportData", err);
      console.log(err);
      res.status(500).json({message: 'An error occurred while reading file'});
    } else {
      console.log("passportData fetched");
      res.json(JSON.parse(data.toString()));
    }
  });
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
