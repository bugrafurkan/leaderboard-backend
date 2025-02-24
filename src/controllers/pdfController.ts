import { Request, Response, NextFunction } from 'express';
import { leaderboardService } from "../services/leaderboardService";
import PDFDocument from 'pdfkit';
import { PDF_DEFAULT_CONFIG} from "../config/pdfConfig";

export const pdfController = {
  async getLeaderboardPDF(req: Request, res: Response, next: NextFunction) {
    try {
      //top 100
      const leaderboardData = await leaderboardService.getLeaderboard();

      //PDF
      const doc = new PDFDocument({
        margin: PDF_DEFAULT_CONFIG.margin
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="leaderboard.pdf"');

      doc.pipe(res);

      doc.font(PDF_DEFAULT_CONFIG.font).fontSize(PDF_DEFAULT_CONFIG.fontsize);
      doc.fontSize(20);
      doc.text('Leaderboard Top 100', {
        align: 'center'
      });
      doc.moveDown();

      if(leaderboardData.top100Entries.length === 0){
        doc.text('No data found.');
      }else {
        doc.fontSize(14);
        doc.text('Rank | PlayerId | Score');
        doc.moveDown();
        leaderboardData.top100Entries.forEach((entry,index) => {
          const rank = index + 1;
          doc.text('${rank} | ${entry.playerId} | ${entry.score}');
        });
      }

      doc.end();
    }catch (error) {
      next(error);
    }
  }
};
