export const uploadFileStage = (sheetId: string, workbookId: string) => `<br /><br />

<p align="center">
<a href="https://plane.so">
  <img src="https://plane-marketing.s3.ap-south-1.amazonaws.com/plane-readme/plane_logo_.webp" alt="Plane Logo" width="70">
</a>
</p>

<h1 align="center"><b>Import Your Data to Plane</b></h1>
<p align="center"><b>Smart data import powered by Flatfile ✨</b></p>

<br />

<div style="max-width: 800px; margin: 0 auto; padding: 20px;">
  <!-- Progress Stages -->
  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px;">
    <div style="text-align: center; flex: 1;">
      <div id="stage1" style="width: 40px; height: 40px; border-radius: 50%; background-color: #3f76ff; color: white; line-height: 40px; margin: 0 auto;">1</div>
      <div style="margin-top: 8px; font-weight: bold;">Getting Started</div>
    </div>
    <div style="flex: 0.5; height: 2px; background-color: #e0e0e0;"></div>
    <div style="text-align: center; flex: 1;">
      <div id="stage2" style="width: 40px; height: 40px; border-radius: 50%; background-color: #e0e0e0; color: #666; line-height: 40px; margin: 0 auto;">2</div>
      <div style="margin-top: 8px;">Upload File</div>
    </div>
    <div style="flex: 0.5; height: 2px; background-color: #e0e0e0;"></div>
    <div style="text-align: center; flex: 1;">
      <div id="stage3" style="width: 40px; height: 40px; border-radius: 50%; background-color: #e0e0e0; color: #666; line-height: 40px; margin: 0 auto;">3</div>
      <div style="margin-top: 8px;">Transform Data</div>
    </div>
    <div style="flex: 0.5; height: 2px; background-color: #e0e0e0;"></div>
    <div style="text-align: center; flex: 1;">
      <div id="stage4" style="width: 40px; height: 40px; border-radius: 50%; background-color: #e0e0e0; color: #666; line-height: 40px; margin: 0 auto;">4</div>
      <div style="margin-top: 8px;">Submit</div>
    </div>
  </div>

  <!-- Embedded Flatfile Sheet -->
  <div id="flatfile-container" style="width: 100%; min-height: 500px; border-radius: 8px; background: #f8f9fa;">
    <embed type="embedded-sheet" name="Data Import" defaultExpanded="true" sheetId="${sheetId}" workbookId="${workbookId}">
  </div>

  <div style="text-align: center; margin-top: 20px; color: #666;">
    <p>Need help? Check out our <a href="#" style="color: #3f76ff; text-decoration: none;">import documentation</a></p>
  </div>
</div>`;
