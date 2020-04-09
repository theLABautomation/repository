HOST=ftp.10.0.1.1
USER=pi
PASSWORD=raspberry

ftp -inv $HOST <<EOF
user $USER $PASSWORD
test.txt
mput *.html
bye

