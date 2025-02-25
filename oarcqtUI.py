import sys
from PyQt5.QtWidgets import QApplication, QMainWindow
from PyQt5.QtWebEngineWidgets import QWebEngineView

class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.browser = QWebEngineView()
        self.browser.setUrl("http://localhost:3000")  # URL of your Next.js app
        self.setCentralWidget(self.browser)
        self.showMaximized()

app = QApplication(sys.argv)
window = MainWindow()
app.exec_()
