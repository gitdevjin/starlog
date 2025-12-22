import { Test, TestingModule } from '@nestjs/testing';
import { PostService } from './post.service';
import { S3Service } from 'src/aws/s3.service';
import { PrismaService } from 'src/prisma/prisma.service';

describe('PostService', () => {
  let postService: PostService;
  let mockS3Service: Partial<S3Service>;
  let mockPrismaService: Partial<PrismaService>;

  beforeEach(async () => {
    mockS3Service = {
      uploadPostImages: jest.fn(),
      deleteImagesByKey: jest.fn(),
    };

    mockPrismaService = {
      post: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostService,
        {
          provide: S3Service,
          useValue: mockS3Service,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    postService = module.get<PostService>(PostService);
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(postService).toBeDefined();
  });

  describe('createPost', () => {
    it('should create a post successfully', async () => {
      const testFile = {
        fieldname: 'images',
        originalname: 'test.png',
        encoding: '7bit',
        mimetype: 'image/png',
        buffer: Buffer.from(''),
        size: 0,
      } as Express.Multer.File;

      // Mock successful S3 upload
      (mockS3Service.uploadPostImages as jest.Mock).mockResolvedValue([
        'http://mocked-url/test.png',
      ]);

      // Mock Prisma post creation
      (mockPrismaService.post.create as jest.Mock).mockResolvedValue({
        id: 'post-id-123',
        content: 'test content',
        imageUrls: ['http://mocked-url/test.png'],
        authorId: 'user-id-123',
      });

      const result = await postService.createPost({
        userId: 'user-id-123',
        content: 'test content',
        images: [testFile],
      });

      expect(result.id).toBe('post-id-123');
      expect(mockS3Service.uploadPostImages).toHaveBeenCalled();
      expect(mockPrismaService.post.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            content: 'test content',
            imageUrls: ['http://mocked-url/test.png'],
            authorId: 'user-id-123',
          }),
        })
      );
    });

    it('should clean up uploaded images if S3 upload fails', async () => {
      const testFile = {
        fieldname: 'images',
        originalname: 'test.png',
        encoding: '7bit',
        mimetype: 'image/png',
        buffer: Buffer.from(''),
        size: 0,
      } as Express.Multer.File;

      (mockS3Service.uploadPostImages as jest.Mock).mockRejectedValue({
        error: new Error('S3 failed'),
        uploadedKeys: ['posts/user-id-123/test-key.png'],
      });

      await expect(
        postService.createPost({
          userId: 'user-id-123',
          content: 'test content',
          images: [testFile],
        })
      ).rejects.toThrow('Create Post Failed');

      expect(mockS3Service.deleteImagesByKey).toHaveBeenCalledWith([
        'posts/user-id-123/test-key.png',
      ]);
    });
  });
});
