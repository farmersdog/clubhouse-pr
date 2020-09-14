# Specify the version of Go to use
FROM golang:1.15

# Copy all the files from the host into the container
WORKDIR /src
COPY . .

# Enable Go modules
ENV GO111MODULE=on

RUN go build -o /bin/action

ENTRYPOINT ["/bin/action"]
