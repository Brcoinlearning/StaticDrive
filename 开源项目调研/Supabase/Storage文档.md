# Supabase Storage Documentation

## Overview

Supabase Storage is a robust, scalable solution for managing files of any size with fine-grained access controls and optimized delivery. It provides specialized bucket types optimized for different use cases.

## Key Features

### Core Capabilities

- **Multi Protocol** - S3 compatible Storage, RESTful API, TUS resumable uploads
- **Global CDN** - Serve your assets with lightning-fast performance from over 285 cities worldwide
- **Image Optimization** - Resize, compress, and transform media files on the fly with built-in image processing
- **Fine-grained Access Control** - Manage file permissions with row-level security and custom policies
- **Multiple Bucket Types** - Specialized storage solutions for different use cases

## Storage Bucket Types

### Files Buckets

Store and serve traditional files including images, videos, documents, and general-purpose content.

**Use Cases:**
- User-generated content
- Media libraries
- Asset management
- Images, videos, documents, PDFs, archives

**Features:**
- Global CDN delivery
- Image optimization and transformation
- Row-level security integration
- Direct URL access for files

### Analytics Buckets

Purpose-built for storing and analyzing data in open table formats like Apache Iceberg.

**Use Cases:**
- Data lakes
- Analytics pipelines
- ETL operations
- Historical data analysis
- Time-series data, logs, large-scale analytical workloads

**Features:**
- Apache Iceberg table format support
- SQL-accessible via Postgres foreign tables
- Partitioned data organization
- Efficient data querying and transformation

### Vector Buckets

Specialized storage for vector embeddings and similarity search operations.

**Use Cases:**
- AI-powered search
- Semantic similarity matching
- Embedding storage
- RAG (Retrieval-Augmented Generation) systems

**Features:**
- Optimized vector indexing (HNSW, Flat)
- Multiple distance metrics (cosine, euclidean, L2)
- Metadata filtering for vectors
- Similarity search queries

## S3 Compatibility

### S3 Protocol Support

Supabase Storage is compatible with the S3 protocol. You can use any S3 client to interact with your Storage objects.

**Key Features:**
- Standard, resumable, and S3 uploads are all interoperable
- Upload with S3 protocol and list with REST API (or vice versa)
- Presigned URL support using AWS Signature Version 4

### Implemented S3 Endpoints

**Bucket Operations:**
- ✅ ListBuckets
- ✅ HeadBucket
- ✅ CreateBucket
- ✅ DeleteBucket
- ✅ GetBucketLocation

**Object Operations:**
- ✅ HeadObject (with conditional operations)
- ✅ ListObjects / ListObjectsV2
- ✅ GetObject (with range support)
- ✅ PutObject (with metadata support)
- ✅ DeleteObject / DeleteObjects
- ✅ Multipart upload operations
- ✅ CopyObject
- ✅ ListParts

## Access Control

### Row Level Security (RLS)

Storage integrates deeply with Postgres Row Level Security:

- File permissions managed through database policies
- Custom access policies per bucket
- User-specific access control
- Role-based permissions

### Authentication Integration

- Works seamlessly with Supabase Auth
- JWT-based authentication
- Fine-grained permission control
- Public and private file access

## API Usage

### REST API

Storage provides a comprehensive REST API for:

- Bucket management
- File upload/download
- Folder operations
- Metadata management
- Transformations

### S3 Protocol

Enable S3 protocol access for:

- S3-compatible tools (rclone, AWS CLI)
- Existing S3 workflows
- Third-party S3 clients
- Batch operations

## Image Transformation

### Built-in Image Processing

Storage includes imgproxy for on-the-fly image processing:

**Capabilities:**
- Resize and crop
- Format conversion
- Quality optimization
- Watermarking
- Multiple transformations in single request

### Transformation Examples

- Resize: `/transform/width,height/`
- Quality: `/transform/quality:80/`
- Format: `/transform/format:webp/`

## File Upload Methods

### Upload Protocols

1. **Standard Upload** - Simple HTTP POST upload
2. **Resumable Upload (TUS)** - For large files and unreliable networks
3. **S3 Protocol** - Using S3-compatible clients

### Upload Features

- Chunked uploads for large files
- Resume capability for interrupted uploads
- Progress tracking
- Automatic retries

## Storage Configuration

### Environment Variables

**S3 Protocol Configuration:**
- `S3_PROTOCOL_ACCESS_KEY_ID`: Access key ID
- `S3_PROTOCOL_ACCESS_KEY_SECRET`: Secret key
- `MINIO_ROOT_PASSWORD`: Root administrator password

**Storage Backend:**
- File backend (default)
- S3-compatible backend (AWS S3, MinIO, Cloudflare R2)

### CDN Configuration

- Automatic CDN integration
- Global edge locations
- Caching policies
- Custom domain support

## Best Practices

### Organization

- Use separate buckets for different purposes
- Implement proper folder structures
- Use consistent naming conventions
- Plan for growth and scale

### Security

- Implement proper RLS policies
- Use appropriate authentication
- Regularly audit permissions
- Monitor access patterns

### Performance

- Enable CDN for public content
- Use appropriate file sizes
- Implement caching strategies
- Optimize images for web

## Integration Examples

### Client SDK Usage

```javascript
// Upload a file
const { data, error } = await supabase.storage
  .from('avatars')
  .upload('public/avatar1.png', file)

// Download a file
const { data, error } = await supabase.storage
  .from('avatars')
  .download('public/avatar1.png')

// Get public URL
const { data } = supabase.storage
  .from('avatars')
  .getPublicUrl('public/avatar1.png')
```

### S3 Client Usage

```bash
# Using AWS CLI
aws s3 ls s3://my-bucket/ \
  --endpoint-url http://localhost:8000 \
  --access-key-id YOUR_KEY \
  --secret-access-key YOUR_SECRET
```

## Resources

- GitHub Repository: Storage templates and examples
- Source Code: Supabase GitHub repository
- Documentation: S3 Compatibility specification
- Community Examples: Real-world implementations

## Pricing Considerations

For self-hosted Storage:
- Disk space requirements
- Bandwidth usage
- CDN costs (if using external CDN)
- Backup storage needs

## Troubleshooting

### Common Issues

- Upload failures: Check file size limits and network
- Permission errors: Verify RLS policies
- CDN issues: Check DNS propagation
- Storage limits: Monitor disk space

### Monitoring

- Storage usage metrics
- Upload/download statistics
- Error rates
- Performance monitoring