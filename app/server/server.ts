import express, {Request, Response} from 'express';
import bodyParser from 'body-parser';
import fs from 'fs';

const app = express();

// parse application/json
app.use(bodyParser.json());

app.post('/passportData', (req: Request, res: Response) => {
  const data = req.body;
  fs.writeFile('passportData.json', JSON.stringify(data, null, 2), err => {
    if (err) {
      console.log(err);
      res.status(500).json({message: 'An error occurred while writing file'});
    } else {
      res.json({message: 'File written successfully'});
    }
  });
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
