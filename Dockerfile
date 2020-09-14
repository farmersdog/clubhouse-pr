# Credit: https://www.sethvargo.com/writing-github-actions-in-go/
#
# Step 1
#

FROM golang:1.15 AS builder

# Install upx (upx.github.io) to compress the compiled action
RUN apt-get update && apt-get -y install upx

# Turn on Go modules support and disable CGO
ENV GO111MODULE=on CGO_ENABLED=0

COPY . .

RUN go build \
  -a \
  -trimpath \
  -ldflags "-s -w -extldflags '-static'" \
  -installsuffix cgo \
  -tags netgo \
  -o /bin/action \
  .

# Strip any symbols - this is not a library
RUN strip /bin/action

# Compress the compiled action
RUN upx -q -9 /bin/action


# Step 2

# Use the most basic and empty container - this container has no
# runtime, files, shell, libraries, etc.
FROM scratch

# Copy over SSL certificates from the first step - this is required
# if our code makes any outbound SSL connections because it contains
# the root CA bundle.
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

# Copy over the compiled action from the first step
COPY --from=builder /bin/action /bin/action

# Specify the container's entrypoint as the action
ENTRYPOINT ["/bin/action"]
