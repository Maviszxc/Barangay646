const mongoose = require('mongoose');
require('dotenv').config();
const CertificateRequest = require('./APP/models/certificate_model');
const { approveCertificateRequest } = require('./APP/controllers/certificate_controller');

// Connect to database
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27016/barangay646')
  .then(async () => {
    console.log('Connected to database');
    
    try {
      // Find resolved e-blotter requests without PDF
      const resolvedEBlotters = await CertificateRequest.find({
        certificateType: 'e_blotter',
        status: 'Resolved',
        adminGeneratedFile: { $exists: false }
      });
      
      console.log(`Found ${resolvedEBlotters.length} resolved e-blotter requests without PDF`);
      
      for (const request of resolvedEBlotters) {
        console.log(`Generating PDF for request: ${request._id}`);
        
        // Mock request object for approveCertificateRequest
        const mockReq = {
          params: { requestId: request._id },
          user: { userId: 'admin' } // You might need to use a real admin ID
        };
        
        // Mock response object
        let responseData = null;
        const mockRes = {
          status: (code) => ({
            json: (data) => {
              responseData = data;
              console.log(`Response: ${code}`, data);
            }
          })
        };
        
        try {
          await approveCertificateRequest(mockReq, mockRes);
          console.log(`✅ PDF generated for request ${request._id}`);
        } catch (error) {
          console.error(`❌ Error generating PDF for request ${request._id}:`, error.message);
        }
      }
      
      console.log('✅ PDF generation completed');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      mongoose.connection.close();
    }
  })
  .catch(err => {
    console.error('Database connection error:', err);
  });
